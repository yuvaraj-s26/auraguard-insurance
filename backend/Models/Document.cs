using System;

namespace InsuranceApi.Models
{
    public class Document
    {
        public int DocumentId { get; set; }
        public int PolicyId { get; set; }
        public Policy? Policy { get; set; }
        
        public int? ClaimId { get; set; }
        public Claim? Claim { get; set; }
        
        public required string FileName { get; set; }
        public required string FilePath { get; set; }
        public DateTime UploadDate { get; set; }
        public required string DocumentType { get; set; } // Aadhaar, PAN, Passport, Medical, Accident, PolicyDoc

        public required string Status { get; set; } = "Pending"; // Pending, Verified, Rejected
        public string? ReviewComment { get; set; }
        public string? UploadedByName { get; set; }
        public string? UploadedByRole { get; set; }
    }
}
