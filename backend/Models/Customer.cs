using System;

namespace InsuranceApi.Models
{
    public class Customer
    {
        public int CustomerId { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public DateTime DOB { get; set; }
        public required string Gender { get; set; }
        public required string Phone { get; set; }
        public required string Address { get; set; }
        public required string Aadhaar { get; set; }
        public required string NomineeName { get; set; }
        public required string NomineeRelationship { get; set; }
    }
}
