using System;

namespace InsuranceApi.Models
{
    public class Policy
    {
        public int PolicyId { get; set; }
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        
        public int PolicyTypeId { get; set; }
        public PolicyType? PolicyType { get; set; }
        
        public required string PolicyNumber { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Premium { get; set; }
        public required string Status { get; set; } // Pending, Active, Expired, Cancelled
    }
}
