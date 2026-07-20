using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InsuranceApi.Data;
using InsuranceApi.Models;
using InsuranceApi.DTOs;
using InsuranceApi.Services;
using System;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PolicyController : ControllerBase
    {
        private readonly InsuranceDbContext _context;

        public PolicyController(InsuranceDbContext context)
        {
            _context = context;
        }

        [HttpGet("types")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPolicyTypes()
        {
            var types = await _context.PolicyTypes.ToListAsync();
            return Ok(types);
        }

        [HttpGet]
        public async Task<IActionResult> GetPolicies([FromQuery] string? status, [FromQuery] int? customerId)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            var query = _context.Policies
                .Include(p => p.Customer)
                .ThenInclude(c => c.User)
                .Include(p => p.PolicyType)
                .AsQueryable();

            if (userRole == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null)
                {
                    return Ok(new object[] { });
                }
                query = query.Where(p => p.CustomerId == customer.CustomerId);
            }
            else if (customerId.HasValue)
            {
                query = query.Where(p => p.CustomerId == customerId.Value);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            var policies = await query.Select(p => new
            {
                p.PolicyId,
                p.CustomerId,
                CustomerName = p.Customer.User.Name,
                p.PolicyTypeId,
                PolicyName = p.PolicyType.PolicyName,
                p.PolicyNumber,
                p.StartDate,
                p.EndDate,
                p.Premium,
                p.Status
            }).ToListAsync();

            return Ok(policies);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPolicy(int id)
        {
            var policy = await _context.Policies
                .Include(p => p.Customer)
                .ThenInclude(c => c.User)
                .Include(p => p.PolicyType)
                .FirstOrDefaultAsync(p => p.PolicyId == id);

            if (policy == null)
            {
                return NotFound(new { message = "Policy not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer" && policy.Customer?.UserId.ToString() != userIdClaim)
            {
                return Forbid();
            }

            return Ok(new
            {
                policy.PolicyId,
                policy.CustomerId,
                CustomerName = policy.Customer?.User.Name,
                policy.PolicyTypeId,
                PolicyName = policy.PolicyType?.PolicyName,
                policy.PolicyNumber,
                policy.StartDate,
                policy.EndDate,
                policy.Premium,
                policy.Status,
                SumAssured = policy.PolicyType?.Coverage
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreatePolicy([FromBody] PolicyCreateRequest request)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            var customer = await _context.Customers.FindAsync(request.CustomerId);
            if (customer == null)
            {
                return BadRequest(new { message = "Customer not found." });
            }

            // Customers can only create policies for themselves
            if (userRole == "Customer" && customer.UserId.ToString() != userIdClaim)
            {
                return Forbid();
            }
            else if (userRole != "Admin" && userRole != "Agent" && userRole != "Customer")
            {
                return Forbid();
            }

            var type = await _context.PolicyTypes.FindAsync(request.PolicyTypeId);
            if (type == null)
            {
                return BadRequest(new { message = "Policy plan not found." });
            }

            var rnd = new Random();
            var policyNum = $"POL-{rnd.Next(100000, 999999)}";
            while (await _context.Policies.AnyAsync(p => p.PolicyNumber == policyNum))
            {
                policyNum = $"POL-{rnd.Next(100000, 999999)}";
            }

            var premium = request.SumAssured * type.PremiumRate;

            var policy = new Policy
            {
                CustomerId = request.CustomerId,
                PolicyTypeId = request.PolicyTypeId,
                PolicyNumber = policyNum,
                StartDate = DateTime.UtcNow.Date,
                EndDate = DateTime.UtcNow.AddYears(1).Date,
                Premium = premium,
                Status = "Pending"
            };

            _context.Policies.Add(policy);
            await _context.SaveChangesAsync();

            if (userRole == "Agent")
            {
                var user = await _context.Users.FindAsync(int.Parse(userIdClaim));
                if (user != null)
                {
                    await AuditLogger.LogActionAsync(_context, user.UserId, user.Name, 
                        "Create Policy", 
                        $"Agent issued Policy {policy.PolicyNumber} ({type.PolicyName}) to Customer ID {policy.CustomerId} (Premium: ₹{policy.Premium:F2}, Sum Assured: ₹{request.SumAssured:F2}).");
                }
            }

            return CreatedAtAction(nameof(GetPolicy), new { id = policy.PolicyId }, policy);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePolicy(int id, [FromBody] PolicyUpdateRequest request)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Agent")
            {
                return Forbid();
            }

            var policy = await _context.Policies.FindAsync(id);
            if (policy == null)
            {
                return NotFound(new { message = "Policy not found." });
            }

            policy.StartDate = request.StartDate;
            policy.EndDate = request.EndDate;
            policy.Premium = request.Premium;
            policy.Status = request.Status;

            _context.Entry(policy).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            if (userRole == "Agent")
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
                var user = await _context.Users.FindAsync(int.Parse(userIdClaim));
                if (user != null)
                {
                    await AuditLogger.LogActionAsync(_context, user.UserId, user.Name, 
                        "Update Policy", 
                        $"Agent updated Policy {policy.PolicyNumber} details (Status: '{policy.Status}', Premium: ₹{policy.Premium:F2}).");
                }
            }

            return Ok(new { message = "Policy updated successfully." });
        }

        [HttpPost("{id}/renew")]
        public async Task<IActionResult> RenewPolicy(int id)
        {
            var policy = await _context.Policies.FindAsync(id);
            if (policy == null)
            {
                return NotFound(new { message = "Policy not found." });
            }

            if (policy.Status == "Cancelled")
            {
                return BadRequest(new { message = "Cancelled policies cannot be renewed." });
            }

            policy.EndDate = policy.EndDate.AddYears(1);
            policy.Status = "Pending";

            await _context.SaveChangesAsync();

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "Agent")
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
                var user = await _context.Users.FindAsync(int.Parse(userIdClaim));
                if (user != null)
                {
                    await AuditLogger.LogActionAsync(_context, user.UserId, user.Name, 
                        "Renew Policy", 
                        $"Agent requested renewal for Policy {policy.PolicyNumber}. End date extended.");
                }
            }

            return Ok(new { message = "Policy renewal requested. Please pay the premium.", policy });
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelPolicy(int id)
        {
            var policy = await _context.Policies.FindAsync(id);
            if (policy == null)
            {
                return NotFound(new { message = "Policy not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null || policy.CustomerId != customer.CustomerId)
                {
                    return Forbid();
                }
            }

            policy.Status = "Cancelled";
            await _context.SaveChangesAsync();

            if (userRole == "Agent")
            {
                var user = await _context.Users.FindAsync(int.Parse(userIdClaim));
                if (user != null)
                {
                    await AuditLogger.LogActionAsync(_context, user.UserId, user.Name, 
                        "Cancel Policy", 
                        $"Agent cancelled Policy {policy.PolicyNumber}.");
                }
            }

            return Ok(new { message = "Policy cancelled successfully.", policy });
        }

        [HttpGet("reminders")]
        public async Task<IActionResult> GetRenewals()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            var threshold = DateTime.UtcNow.AddDays(30);
            var query = _context.Policies
                .Include(p => p.Customer)
                .ThenInclude(c => c.User)
                .Include(p => p.PolicyType)
                .Where(p => p.EndDate <= threshold && p.Status == "Active");

            if (userRole == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null)
                {
                    return Ok(new object[] { });
                }
                query = query.Where(p => p.CustomerId == customer.CustomerId);
            }

            var remindersData = await query.Select(p => new
            {
                p.PolicyId,
                p.PolicyNumber,
                PolicyName = p.PolicyType.PolicyName,
                CustomerName = p.Customer.User.Name,
                p.EndDate,
                p.Premium
            }).ToListAsync();

            var reminders = remindersData.Select(r => new
            {
                r.PolicyId,
                r.PolicyNumber,
                r.PolicyName,
                r.CustomerName,
                r.EndDate,
                r.Premium,
                DaysRemaining = (r.EndDate - DateTime.UtcNow.Date).Days
            }).ToList();

            return Ok(reminders);
        }
    }
}
