namespace InsuranceApi.DTOs
{
    public class PaymentRequest
    {
        public int PolicyId { get; set; }
        public decimal Amount { get; set; }
        public required string PaymentMode { get; set; } // Credit Card, UPI, Net Banking, Cash
    }
}
