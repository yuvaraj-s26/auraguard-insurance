namespace InsuranceApi.DTOs
{
    public class LoginRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class LoginResponse
    {
        public required string Token { get; set; }
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Role { get; set; }
        public int UserId { get; set; }
        public int? CustomerId { get; set; }
    }

    public class RegisterRequest
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string Role { get; set; } // Agent, Customer
    }
}
