using System.Text.Json.Serialization;

namespace InsuranceApi.Models
{
    public class User
    {
        public int UserId { get; set; }
        public required string Name { get; set; }
        public required string Email { get; set; }
        
        [JsonIgnore]
        public string Password { get; set; } = string.Empty;
        public required string Role { get; set; } // Admin, Agent, Customer
        public bool IsApproved { get; set; } = true;
    }
}
