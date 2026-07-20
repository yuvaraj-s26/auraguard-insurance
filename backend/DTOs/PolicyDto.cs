using System;

namespace InsuranceApi.DTOs
{
    public class PolicyCreateRequest
    {
        public int CustomerId { get; set; }
        public int PolicyTypeId { get; set; }
        public decimal SumAssured { get; set; }
    }

    public class PolicyUpdateRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Premium { get; set; }
        public required string Status { get; set; }
    }
}
