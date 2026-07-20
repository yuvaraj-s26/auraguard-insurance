using System;

namespace InsuranceApi.DTOs
{
    public class ClaimCreateRequest
    {
        public int PolicyId { get; set; }
        public int CustomerId { get; set; }
        public DateTime IncidentDate { get; set; }
        public decimal ClaimAmount { get; set; }
        public required string Description { get; set; }
    }

    public class ClaimStatusUpdateRequest
    {
        public required string Status { get; set; } // Pending, Under Review, Approved, Rejected, Settled
    }

    public class ClaimCommentRequest
    {
        public required string Message { get; set; }
        public bool IsPrivate { get; set; }
    }
}
