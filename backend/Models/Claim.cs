using System;

namespace InsuranceApi.Models
{
    public class Claim
    {
        public int ClaimId { get; set; }
        public int PolicyId { get; set; }
        public Policy? Policy { get; set; }
        
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        
        public DateTime ClaimDate { get; set; }
        public DateTime IncidentDate { get; set; }
        public decimal ClaimAmount { get; set; }
        public required string Description { get; set; }
        public required string Status { get; set; } // Pending, Under Review, Approved, Rejected, Settled
        public DateTime? ProcessedDate { get; set; }

        public required string RulesCheckResult { get; set; } = "Not Run"; // PASS, WARNING, FAIL
        public string? RulesCheckReason { get; set; }
    }
}
