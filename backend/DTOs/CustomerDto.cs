using System;

namespace InsuranceApi.DTOs
{
    public class CustomerCreateRequest
    {
        public int? UserId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public DateTime DOB { get; set; }
        public required string Gender { get; set; }
        public required string Phone { get; set; }
        public required string Address { get; set; }
        public required string Aadhaar { get; set; }
        public required string NomineeName { get; set; }
        public required string NomineeRelationship { get; set; }
    }

    public class CustomerUpdateRequest
    {
        public DateTime DOB { get; set; }
        public required string Gender { get; set; }
        public required string Phone { get; set; }
        public required string Address { get; set; }
        public required string Aadhaar { get; set; }
        public required string NomineeName { get; set; }
        public required string NomineeRelationship { get; set; }
    }
}
