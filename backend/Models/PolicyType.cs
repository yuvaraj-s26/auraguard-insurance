namespace InsuranceApi.Models
{
    public class PolicyType
    {
        public int PolicyTypeId { get; set; }
        public required string PolicyName { get; set; }
        public required string Description { get; set; }
        public decimal Coverage { get; set; }
        public decimal PremiumRate { get; set; } // Rate used to calculate annual premium
    }
}
