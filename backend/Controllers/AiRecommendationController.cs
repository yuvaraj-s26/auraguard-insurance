using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InsuranceApi.Data;
using InsuranceApi.Models;
using System;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AiRecommendationController : ControllerBase
    {
        private readonly InsuranceDbContext _context;

        public AiRecommendationController(InsuranceDbContext context)
        {
            _context = context;
        }

        [HttpGet("recommendations")]
        public async Task<IActionResult> GetRecommendations([FromQuery] int? customerId)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            Customer? targetCustomer = null;
            if (userRole == "Customer")
            {
                targetCustomer = await _context.Customers
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
            }
            else if (customerId.HasValue)
            {
                targetCustomer = await _context.Customers
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.CustomerId == customerId.Value);
            }

            var policyTypes = await _context.PolicyTypes.ToListAsync();
            var existingPolicies = targetCustomer != null 
                ? await _context.Policies.Where(p => p.CustomerId == targetCustomer.CustomerId).ToListAsync()
                : new List<Models.Policy>();

            var existingPolicyTypeIds = existingPolicies.Select(p => p.PolicyTypeId).ToHashSet();

            int age = 30;
            if (targetCustomer != null && targetCustomer.DOB != default)
            {
                var today = DateTime.UtcNow;
                age = today.Year - targetCustomer.DOB.Year;
                if (targetCustomer.DOB.Date > today.AddYears(-age)) age--;
            }

            var recommendations = new List<object>();

            foreach (var pt in policyTypes)
            {
                bool isOwned = existingPolicyTypeIds.Contains(pt.PolicyTypeId);
                int matchScore = 70;
                var rationale = new List<string>();
                string priorityTier = "Medium";

                if (pt.PolicyName.Contains("Life", StringComparison.OrdinalIgnoreCase))
                {
                    if (targetCustomer != null && !string.IsNullOrEmpty(targetCustomer.NomineeName))
                    {
                        matchScore += 20;
                        rationale.Add($"Secures beneficiary ({targetCustomer.NomineeName} - {targetCustomer.NomineeRelationship}).");
                    }
                    if (age >= 25 && age <= 45)
                    {
                        matchScore += 10;
                        rationale.Add("Optimal age window for high coverage at lowest locked-in premium rate.");
                    }
                }
                else if (pt.PolicyName.Contains("Health", StringComparison.OrdinalIgnoreCase))
                {
                    matchScore += 15;
                    rationale.Add("Zero copay essential protection against rising outpatient & hospitalization costs.");
                    if (age >= 35)
                    {
                        matchScore += 10;
                        rationale.Add("Recommended critical health shield baseline for your age demographic.");
                    }
                }
                else if (pt.PolicyName.Contains("Vehicle", StringComparison.OrdinalIgnoreCase) || pt.PolicyName.Contains("Motor", StringComparison.OrdinalIgnoreCase))
                {
                    matchScore += 10;
                    rationale.Add("Statutory compliance with 24x7 roadside assistance and zero depreciation.");
                }
                else if (pt.PolicyName.Contains("Property", StringComparison.OrdinalIgnoreCase))
                {
                    if (targetCustomer != null && !string.IsNullOrEmpty(targetCustomer.Address))
                    {
                        matchScore += 15;
                        rationale.Add($"Safeguards residential property in {targetCustomer.Address.Split(',').LastOrDefault()?.Trim() ?? "your region"}.");
                    }
                }

                if (isOwned)
                {
                    matchScore = Math.Max(40, matchScore - 25);
                    rationale.Add("Already active in your portfolio; top-up booster or sum-assured upgrade available.");
                    priorityTier = "Low";
                }
                else
                {
                    priorityTier = matchScore >= 85 ? "High" : matchScore >= 75 ? "Recommended" : "Medium";
                }

                recommendations.Add(new
                {
                    policyTypeId = pt.PolicyTypeId,
                    policyName = pt.PolicyName,
                    description = pt.Description,
                    coverage = pt.Coverage,
                    premiumRate = pt.PremiumRate,
                    estimatedMonthlyPremium = Math.Round(pt.Coverage * pt.PremiumRate / 12, 2),
                    matchScore = Math.Min(99, matchScore),
                    priorityTier,
                    isOwned,
                    rationale = string.Join(" ", rationale)
                });
            }

            return Ok(new
            {
                customerAge = age,
                customerName = targetCustomer?.User.Name ?? "Valued Client",
                recommendations = recommendations.OrderByDescending(r => ((dynamic)r).matchScore).ToList()
            });
        }
    }
}
