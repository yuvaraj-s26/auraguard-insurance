using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InsuranceApi.Data;
using System;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly InsuranceDbContext _context;

        public ReportsController(InsuranceDbContext context)
        {
            _context = context;
        }

        [HttpGet("admin-dashboard")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin")
            {
                return Forbid();
            }

            var totalCustomers = await _context.Customers.CountAsync();
            var totalPolicies = await _context.Policies.CountAsync();
            var activePolicies = await _context.Policies.CountAsync(p => p.Status == "Active");
            var pendingClaims = await _context.Claims.CountAsync(c => c.Status == "Pending" || c.Status == "Under Review");
            var approvedClaims = await _context.Claims.CountAsync(c => c.Status == "Approved" || c.Status == "Settled");

            var totalPremiumCollection = await _context.Payments
                .Where(p => p.Status == "Success")
                .SumAsync(p => p.Amount);

            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            var monthlyPremiumCollection = await _context.Payments
                .Where(p => p.Status == "Success" && p.PaymentDate.Month == currentMonth && p.PaymentDate.Year == currentYear)
                .SumAsync(p => p.Amount);

            var chartData = Enumerable.Range(0, 6)
                .Select(i => DateTime.UtcNow.AddMonths(-i))
                .Select(d => new
                {
                    Month = d.ToString("MMM yyyy"),
                    Year = d.Year,
                    MonthNum = d.Month
                })
                .Reverse()
                .ToList();

            var revenueChart = new System.Collections.Generic.List<object>();
            foreach (var item in chartData)
            {
                var revenue = await _context.Payments
                    .Where(p => p.Status == "Success" && p.PaymentDate.Month == item.MonthNum && p.PaymentDate.Year == item.Year)
                    .SumAsync(p => p.Amount);

                revenueChart.Add(new
                {
                    name = item.Month,
                    revenue = revenue
                });
            }

            var processedClaims = await _context.Claims
                .Where(c => c.ProcessedDate != null)
                .ToListAsync();
            double avgClaimProcessingTimeHours = processedClaims.Any() 
                ? processedClaims.Average(c => (c.ProcessedDate.Value - c.ClaimDate).TotalHours) 
                : 24.5; // baseline demo value

            var totalClaimsPayout = await _context.Claims
                .Where(c => c.Status == "Settled")
                .SumAsync(c => c.ClaimAmount);
            decimal lossRatio = totalPremiumCollection > 0 ? (totalClaimsPayout / totalPremiumCollection) * 100 : 0;

            var customersWithActive = await _context.Policies
                .Where(p => p.Status == "Active")
                .Select(p => p.CustomerId)
                .Distinct()
                .CountAsync();
            decimal retentionRate = totalCustomers > 0 ? ((decimal)customersWithActive / totalCustomers) * 100 : 85.0m;

            // Projected forward revenue next 6 months
            var activePoliciesList = await _context.Policies.Where(p => p.Status == "Active").ToListAsync();
            decimal projectedMonthlyRecurring = activePoliciesList.Sum(p => p.Premium);
            var projectionChart = Enumerable.Range(1, 6).Select(i => new
            {
                month = DateTime.UtcNow.AddMonths(i).ToString("MMM yyyy"),
                projectedRevenue = projectedMonthlyRecurring * (1 + (i * 0.03m)) // estimated 3% organic growth
            }).ToList();

            return Ok(new
            {
                totalCustomers,
                totalPolicies,
                activePolicies,
                pendingClaims,
                approvedClaims,
                totalPremiumCollection,
                monthlyPremiumCollection,
                revenueChart,
                projectionChart,
                projectedMonthlyRecurring,
                avgClaimProcessingTimeHours,
                lossRatio,
                retentionRate
            });
        }

        [HttpGet("agent-dashboard")]
        public async Task<IActionResult> GetAgentDashboard()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Agent")
            {
                return Forbid();
            }

            var customersCount = await _context.Customers.CountAsync();
            var policiesSold = await _context.Policies.CountAsync();
            
            var threshold = DateTime.UtcNow.AddDays(30);
            var pendingRenewals = await _context.Policies
                .CountAsync(p => p.EndDate <= threshold && p.Status == "Active");

            var claimsAssigned = await _context.Claims
                .CountAsync(c => c.Status == "Pending" || c.Status == "Under Review");

            return Ok(new
            {
                customersAssigned = customersCount,
                policiesSold,
                pendingRenewals,
                claimsAssigned
            });
        }

        [HttpGet("customer-dashboard")]
        public async Task<IActionResult> GetCustomerDashboard()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole != "Customer")
            {
                return BadRequest(new { message = "Only accessible by Customers." });
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
            if (customer == null)
            {
                return Ok(new
                {
                    activePolicies = 0,
                    duePremium = 0.00m,
                    pendingClaims = 0,
                    nextRenewalDate = (DateTime?)null
                });
            }

            var activePolicies = await _context.Policies.CountAsync(p => p.CustomerId == customer.CustomerId && p.Status == "Active");
            
            var duePremium = await _context.Policies
                .Where(p => p.CustomerId == customer.CustomerId && p.Status == "Pending")
                .SumAsync(p => p.Premium);

            var pendingClaims = await _context.Claims
                .CountAsync(c => c.CustomerId == customer.CustomerId && (c.Status == "Pending" || c.Status == "Under Review"));

            var nextRenewal = await _context.Policies
                .Where(p => p.CustomerId == customer.CustomerId && p.Status == "Active")
                .OrderBy(p => p.EndDate)
                .Select(p => (DateTime?)p.EndDate)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                activePolicies,
                duePremium,
                pendingClaims,
                nextRenewalDate = nextRenewal
            });
        }

        [HttpGet("export/payments")]
        public async Task<IActionResult> ExportPaymentsCsv()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Agent") return Forbid();

            var payments = await _context.Payments
                .Include(p => p.Policy)
                .ThenInclude(pol => pol.Customer)
                .ThenInclude(c => c.User)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Payment ID,Transaction ID,Policy Number,Client Name,Amount (INR),Payment Mode,Status,Date");
            foreach (var p in payments)
            {
                sb.AppendLine($"\"{p.PaymentId}\",\"{p.TransactionId}\",\"{p.Policy?.PolicyNumber}\",\"{p.Policy?.Customer?.User?.Name}\",\"{p.Amount:F2}\",\"{p.PaymentMode}\",\"{p.Status}\",\"{p.PaymentDate:yyyy-MM-dd HH:mm:ss}\"");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"AuraGuard-Payments-Export-{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }

        [HttpGet("export/claims")]
        public async Task<IActionResult> ExportClaimsCsv()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Agent") return Forbid();

            var claims = await _context.Claims
                .Include(c => c.Policy)
                .Include(c => c.Customer)
                .ThenInclude(cu => cu.User)
                .OrderByDescending(c => c.ClaimDate)
                .ToListAsync();

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Claim ID,Policy Number,Client Name,Claim Amount (INR),Incident Date,Filed Date,Status,Rules Result,AI Fraud Risk Score,AI Risk Level,Risk Diagnostic Summary");
            foreach (var c in claims)
            {
                var cleanDesc = c.FraudRiskFactors?.Replace("\"", "'") ?? "Clean profile";
                sb.AppendLine($"\"{c.ClaimId}\",\"{c.Policy?.PolicyNumber}\",\"{c.Customer?.User?.Name}\",\"{c.ClaimAmount:F2}\",\"{c.IncidentDate:yyyy-MM-dd}\",\"{c.ClaimDate:yyyy-MM-dd}\",\"{c.Status}\",\"{c.RulesCheckResult}\",\"{c.FraudRiskScore}\",\"{c.FraudRiskLevel}\",\"{cleanDesc}\"");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"AuraGuard-Claims-Audit-{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }
    }
}
