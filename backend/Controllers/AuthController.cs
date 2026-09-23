using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InsuranceApi.Data;
using InsuranceApi.Models;
using InsuranceApi.DTOs;
using InsuranceApi.Services;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly InsuranceDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthController(InsuranceDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email is already in use." });
            }

            var isAgent = request.Role == "Agent";
            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role, // Admin, Agent, Customer
                IsApproved = !isAgent // Auto-approve if NOT agent
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            if (isAgent)
            {
                return Ok(new { message = "Agent registration request submitted to administrator. Your account is pending approval." });
            }
            return Ok(new { message = "Registration successful. Please log in." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var cleanEmail = request.Email?.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password?.Trim(), user.Password))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            if (user.Role == "Agent" && !user.IsApproved)
            {
                return BadRequest(new { message = "Your agent registration request is pending admin approval." });
            }

            var token = _tokenService.GenerateToken(user);

            // If the user is a customer, fetch their CustomerId
            int? customerId = null;
            if (user.Role == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == user.UserId);
                customerId = customer?.CustomerId;
            }

            return Ok(new LoginResponse
            {
                Token = token,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                UserId = user.UserId,
                CustomerId = customerId
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                              ?? User.FindFirst("userId")?.Value;

            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "User not identified." });
            }

            var userId = int.Parse(userIdClaim);
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (user.Role == "Agent" && !user.IsApproved)
            {
                return Unauthorized(new { message = "Your agent account has been suspended or is pending approval." });
            }

            int? customerId = null;
            if (user.Role == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == user.UserId);
                customerId = customer?.CustomerId;
            }

            return Ok(new
            {
                user.UserId,
                user.Name,
                user.Email,
                user.Role,
                CustomerId = customerId
            });
        }

        [HttpGet("pending-agents")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingAgents()
        {
            var pending = await _context.Users
                .Where(u => u.Role == "Agent" && !u.IsApproved)
                .Select(u => new { u.UserId, u.Name, u.Email, u.Role })
                .ToListAsync();
            return Ok(pending);
        }

        [HttpPost("approve-agent/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveAgent(int id)
        {
            var agent = await _context.Users.FindAsync(id);
            if (agent == null || agent.Role != "Agent")
            {
                return NotFound(new { message = "Agent not found." });
            }

            agent.IsApproved = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Agent account approved successfully." });
        }

        [HttpPost("reject-agent/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectAgent(int id)
        {
            var agent = await _context.Users.FindAsync(id);
            if (agent == null || agent.Role != "Agent")
            {
                return NotFound(new { message = "Agent not found." });
            }

            _context.Users.Remove(agent);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Agent registration request rejected and deleted." });
        }

        [HttpGet("approved-agents")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetApprovedAgents()
        {
            var approved = await _context.Users
                .Where(u => u.Role == "Agent" && u.IsApproved)
                .Select(u => new { u.UserId, u.Name, u.Email, u.Role })
                .ToListAsync();
            return Ok(approved);
        }

        [HttpPost("revoke-agent/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RevokeAgent(int id)
        {
            var agent = await _context.Users.FindAsync(id);
            if (agent == null || agent.Role != "Agent")
            {
                return NotFound(new { message = "Agent not found." });
            }

            agent.IsApproved = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Agent access revoked successfully." });
        }
    }
}
