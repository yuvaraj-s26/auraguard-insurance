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
    public class PaymentController : ControllerBase
    {
        private readonly InsuranceDbContext _context;

        public PaymentController(InsuranceDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequest request)
        {
            var policy = await _context.Policies
                .Include(p => p.Customer)
                .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(p => p.PolicyId == request.PolicyId);

            if (policy == null)
            {
                return NotFound(new { message = "Policy not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Customer";
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            var userName = "Unknown";
            
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                var user = await _context.Users.FindAsync(int.Parse(userIdClaim));
                if (user != null)
                {
                    userName = user.Name;
                }
            }

            var txnId = $"TXN-{Guid.NewGuid().ToString().Substring(0, 18).ToUpper()}";

            var payment = new Payment
            {
                PolicyId = request.PolicyId,
                Amount = request.Amount,
                PaymentDate = DateTime.UtcNow,
                PaymentMode = request.PaymentMode,
                TransactionId = txnId,
                Status = "Success",
                PayerRole = userRole,
                PayerName = $"{userRole} ({userName})"
            };

            policy.Status = "Active";

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            if (userRole == "Agent")
            {
                await AuditLogger.LogActionAsync(_context, int.Parse(userIdClaim), userName, 
                    "Collect Premium", 
                    $"Agent collected payment of ₹{payment.Amount:F2} for Policy {policy.PolicyNumber} (Transaction: {payment.TransactionId}).");
            }

            return Ok(new
            {
                message = "Payment successful and policy activated.",
                receipt = new
                {
                    payment.PaymentId,
                    payment.PolicyId,
                    PolicyNumber = policy.PolicyNumber,
                    CustomerName = policy.Customer?.User.Name,
                    payment.Amount,
                    payment.PaymentDate,
                    payment.PaymentMode,
                    payment.TransactionId,
                    payment.Status,
                    payment.PayerName,
                    payment.PayerRole
                }
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetPaymentHistory([FromQuery] int? policyId)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            var query = _context.Payments
                .Include(p => p.Policy)
                .ThenInclude(po => po.Customer)
                .ThenInclude(c => c.User)
                .Include(p => p.Policy)
                .ThenInclude(po => po.PolicyType)
                .AsQueryable();

            if (userRole == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null)
                {
                    return Ok(new object[] { });
                }
                query = query.Where(p => p.Policy.CustomerId == customer.CustomerId);
            }

            if (policyId.HasValue)
            {
                query = query.Where(p => p.PolicyId == policyId.Value);
            }

            var history = await query.Select(p => new
            {
                p.PaymentId,
                p.PolicyId,
                PolicyNumber = p.Policy.PolicyNumber,
                PolicyName = p.Policy.PolicyType.PolicyName,
                CustomerName = p.Policy.Customer.User.Name,
                p.Amount,
                p.PaymentDate,
                p.PaymentMode,
                p.TransactionId,
                p.Status,
                p.PayerName,
                p.PayerRole
            }).OrderByDescending(p => p.PaymentDate).ToListAsync();

            return Ok(history);
        }

        [HttpGet("{id}/receipt")]
        public async Task<IActionResult> GetReceipt(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Policy)
                .ThenInclude(po => po.Customer)
                .ThenInclude(c => c.User)
                .Include(p => p.Policy)
                .ThenInclude(po => po.PolicyType)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new { message = "Payment record not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer" && payment.Policy?.Customer?.UserId.ToString() != userIdClaim)
            {
                return Forbid();
            }

            return Ok(new
            {
                payment.PaymentId,
                payment.PolicyId,
                PolicyNumber = payment.Policy?.PolicyNumber,
                PolicyName = payment.Policy?.PolicyType?.PolicyName,
                CustomerName = payment.Policy?.Customer?.User.Name,
                CustomerEmail = payment.Policy?.Customer?.User.Email,
                payment.Amount,
                payment.PaymentDate,
                payment.PaymentMode,
                payment.TransactionId,
                payment.Status,
                payment.PayerName,
                payment.PayerRole
            });
        }
    }
}
