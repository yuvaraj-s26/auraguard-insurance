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
    public class ClaimController : ControllerBase
    {
        private readonly InsuranceDbContext _context;

        public ClaimController(InsuranceDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetClaims([FromQuery] string? status, [FromQuery] int? customerId)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            var query = _context.Claims
                .Include(c => c.Policy)
                .ThenInclude(p => p.PolicyType)
                .Include(c => c.Customer)
                .ThenInclude(cu => cu.User)
                .AsQueryable();

            if (userRole == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null)
                {
                    return Ok(new object[] { });
                }
                query = query.Where(c => c.CustomerId == customer.CustomerId);
            }
            else if (customerId.HasValue)
            {
                query = query.Where(c => c.CustomerId == customerId.Value);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            var claims = await query.Select(c => new
            {
                c.ClaimId,
                c.PolicyId,
                PolicyNumber = c.Policy.PolicyNumber,
                PolicyName = c.Policy.PolicyType.PolicyName,
                c.CustomerId,
                CustomerName = c.Customer.User.Name,
                c.ClaimDate,
                c.IncidentDate,
                c.ClaimAmount,
                c.Description,
                c.Status,
                c.RulesCheckResult,
                c.RulesCheckReason
            }).OrderByDescending(c => c.ClaimDate).ToListAsync();

            return Ok(claims);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClaim(int id)
        {
            var claim = await _context.Claims
                .Include(c => c.Policy)
                .ThenInclude(p => p.PolicyType)
                .Include(c => c.Customer)
                .ThenInclude(cu => cu.User)
                .FirstOrDefaultAsync(c => c.ClaimId == id);

            if (claim == null)
            {
                return NotFound(new { message = "Claim not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer" && claim.Customer?.UserId.ToString() != userIdClaim)
            {
                return Forbid();
            }

            return Ok(new
            {
                claim.ClaimId,
                claim.PolicyId,
                PolicyNumber = claim.Policy?.PolicyNumber,
                PolicyName = claim.Policy?.PolicyType?.PolicyName,
                claim.CustomerId,
                CustomerName = claim.Customer?.User.Name,
                claim.ClaimDate,
                claim.IncidentDate,
                claim.ClaimAmount,
                claim.Description,
                claim.Status,
                claim.RulesCheckResult,
                claim.RulesCheckReason
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateClaim([FromBody] ClaimCreateRequest request)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null || customer.CustomerId != request.CustomerId)
                {
                    return Forbid();
                }
            }

            var policy = await _context.Policies.FindAsync(request.PolicyId);
            if (policy == null || policy.CustomerId != request.CustomerId)
            {
                return BadRequest(new { message = "Invalid policy for the specified customer." });
            }

            string rulesCheckResult = "PASS";
            string rulesCheckReason = "Policy is active, incident date is within coverage limits, and amount is within bounds.";

            if (policy.Status != "Active")
            {
                rulesCheckResult = "FAIL";
                rulesCheckReason = $"Automated Check: Policy status is '{policy.Status}'. Claims can only be processed on active policies.";
            }
            else if (request.IncidentDate < policy.StartDate || request.IncidentDate > policy.EndDate)
            {
                rulesCheckResult = "WARNING";
                rulesCheckReason = $"Automated Check: Incident date ({request.IncidentDate:yyyy-MM-dd}) falls outside policy coverage term ({policy.StartDate:yyyy-MM-dd} to {policy.EndDate:yyyy-MM-dd}).";
            }
            else
            {
                var approvedClaimsSum = await _context.Claims
                    .Where(c => c.PolicyId == request.PolicyId && (c.Status == "Approved" || c.Status == "Settled"))
                    .SumAsync(c => c.ClaimAmount);

                var policyType = await _context.PolicyTypes.FindAsync(policy.PolicyTypeId);
                decimal totalCoverage = policyType?.Coverage ?? 0;
                decimal remainingCoverage = totalCoverage - approvedClaimsSum;

                if (request.ClaimAmount > remainingCoverage)
                {
                    rulesCheckResult = "WARNING";
                    rulesCheckReason = $"Automated Check: Requested amount (${request.ClaimAmount:n2}) exceeds remaining policy coverage of (${remainingCoverage:n2}) (Coverage: ${totalCoverage:n2}, settled claims: ${approvedClaimsSum:n2}).";
                }
            }

            var claim = new InsuranceApi.Models.Claim
            {
                PolicyId = request.PolicyId,
                CustomerId = request.CustomerId,
                ClaimDate = DateTime.UtcNow,
                IncidentDate = request.IncidentDate,
                ClaimAmount = request.ClaimAmount,
                Description = request.Description,
                Status = rulesCheckResult == "FAIL" ? "Rejected" : "Pending",
                RulesCheckResult = rulesCheckResult,
                RulesCheckReason = rulesCheckReason
            };

            _context.Claims.Add(claim);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClaim), new { id = claim.ClaimId }, claim);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateClaimStatus(int id, [FromBody] ClaimStatusUpdateRequest request)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Agent")
            {
                return Forbid();
            }

            var claim = await _context.Claims.FindAsync(id);
            if (claim == null)
            {
                return NotFound(new { message = "Claim not found." });
            }

            var allowedStatuses = new[] { "Pending", "Under Review", "Approved", "Rejected", "Settled", "Pending Settlement" };
            if (!allowedStatuses.Contains(request.Status))
            {
                return BadRequest(new { message = "Invalid claim status." });
            }

            // If the claim is currently in Pending Settlement, only an Admin can change its status!
            if (claim.Status == "Pending Settlement" && userRole != "Admin")
            {
                return BadRequest(new { message = "Only administrators can approve and settle pending payment requests." });
            }

            var targetStatus = request.Status;

            // If the user is an Agent and they try to set the status to "Approved" or "Settled" (or request settlement)
            if ((targetStatus == "Approved" || targetStatus == "Settled") && userRole == "Agent")
            {
                targetStatus = "Pending Settlement";
            }

            claim.Status = targetStatus;

            if (new[] { "Approved", "Rejected", "Settled", "Pending Settlement" }.Contains(targetStatus))
            {
                claim.ProcessedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            if (userRole == "Agent")
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
                var user = await _context.Users.FindAsync(int.Parse(userIdClaim));
                if (user != null)
                {
                    await AuditLogger.LogActionAsync(_context, user.UserId, user.Name, 
                        "Update Claim Status", 
                        $"Agent updated Claim #{id} status to '{targetStatus}' (Requested: {request.Status}).");
                }
            }

            string displayMessage = "Claim status updated successfully.";
            if (targetStatus == "Pending Settlement")
            {
                displayMessage = "Settlement request submitted to administrator. Payment will be released upon approval.";
            }

            return Ok(new { message = displayMessage, claim });
        }

        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetClaimComments(int id)
        {
            var claim = await _context.Claims.FindAsync(id);
            if (claim == null) return NotFound(new { message = "Claim not found." });

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _context.ClaimComments.Where(cc => cc.ClaimId == id);

            if (userRole == "Customer")
            {
                query = query.Where(cc => !cc.IsPrivate);
            }

            var comments = await query
                .OrderBy(cc => cc.CommentDate)
                .Select(cc => new
                {
                    cc.ClaimCommentId,
                    cc.ClaimId,
                    cc.UserId,
                    cc.Message,
                    cc.CommentDate,
                    cc.AuthorName,
                    cc.AuthorRole,
                    cc.IsPrivate
                })
                .ToListAsync();

            return Ok(comments);
        }

        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddClaimComment(int id, [FromBody] ClaimCommentRequest request)
        {
            var claim = await _context.Claims.FindAsync(id);
            if (claim == null) return NotFound(new { message = "Claim not found." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            var user = await _context.Users.FindAsync(int.Parse(userIdClaim));
            if (user == null) return Unauthorized();

            var comment = new ClaimComment
            {
                ClaimId = id,
                UserId = user.UserId,
                Message = request.Message,
                CommentDate = DateTime.UtcNow,
                AuthorName = user.Name,
                AuthorRole = user.Role,
                IsPrivate = request.IsPrivate || user.Role == "Admin" || request.Message.Contains("Request settlement", StringComparison.OrdinalIgnoreCase)
            };

            _context.ClaimComments.Add(comment);
            await _context.SaveChangesAsync();

            if (user.Role == "Agent")
            {
                await AuditLogger.LogActionAsync(_context, user.UserId, user.Name, 
                    "Post Support Comment", 
                    $"Agent posted a message on Claim #{id}: \"{(request.Message.Length > 60 ? request.Message.Substring(0, 57) + "...\"" : request.Message + "\"")}.");
            }

            return Ok(comment);
        }
    }
}
