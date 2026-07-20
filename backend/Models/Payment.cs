using System;

namespace InsuranceApi.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }
        public int PolicyId { get; set; }
        public Policy? Policy { get; set; }
        
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public required string PaymentMode { get; set; }
        public required string TransactionId { get; set; }
        public required string Status { get; set; } // Success, Pending, Failed
        public string PayerName { get; set; } = string.Empty;
        public string PayerRole { get; set; } = string.Empty;
    }
}
