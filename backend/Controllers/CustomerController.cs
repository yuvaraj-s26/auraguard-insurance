using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InsuranceApi.Data;
using InsuranceApi.Models;
using InsuranceApi.DTOs;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly InsuranceDbContext _context;

        public CustomerController(InsuranceDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCustomers([FromQuery] string? search)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Agent")
            {
                return Forbid();
            }

            var query = _context.Customers.Include(c => c.User).AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.User.Name.Contains(search) 
                                      || c.User.Email.Contains(search) 
                                      || c.Phone.Contains(search));
            }

            var customers = await query.Select(c => new
            {
                c.CustomerId,
                c.UserId,
                Name = c.User.Name,
                Email = c.User.Email,
                c.DOB,
                c.Gender,
                c.Phone,
                c.Address,
                c.Aadhaar,
                c.NomineeName,
                c.NomineeRelationship
            }).ToListAsync();

            return Ok(customers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCustomer(int id)
        {
            var customer = await _context.Customers.Include(c => c.User).FirstOrDefaultAsync(c => c.CustomerId == id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            if (userRole == "Customer" && customer.UserId.ToString() != userIdClaim)
            {
                return Forbid();
            }

            return Ok(new
            {
                customer.CustomerId,
                customer.UserId,
                Name = customer.User.Name,
                Email = customer.User.Email,
                customer.DOB,
                customer.Gender,
                customer.Phone,
                customer.Address,
                customer.Aadhaar,
                customer.NomineeName,
                customer.NomineeRelationship
            });
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetCustomerByUserId(int userId)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            if (userRole == "Customer" && userId.ToString() != userIdClaim)
            {
                return Forbid();
            }

            var customer = await _context.Customers.Include(c => c.User).FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
            {
                return NotFound(new { message = "Customer profile not created yet." });
            }

            return Ok(new
            {
                customer.CustomerId,
                customer.UserId,
                Name = customer.User.Name,
                Email = customer.User.Email,
                customer.DOB,
                customer.Gender,
                customer.Phone,
                customer.Address,
                customer.Aadhaar,
                customer.NomineeName,
                customer.NomineeRelationship
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateCustomer([FromBody] CustomerCreateRequest request)
        {
            // Validate age is 18 or above
            var today = DateTime.UtcNow.Date;
            var age = today.Year - request.DOB.Year;
            if (request.DOB.Date > today.AddYears(-age))
            {
                age--;
            }

            if (age < 18)
            {
                return BadRequest(new { message = "Customer must be 18 years of age or older to register." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            int actualUserId = 0;

            if (request.UserId.HasValue)
            {
                actualUserId = request.UserId.Value;
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
                if (userRole == "Customer" && actualUserId.ToString() != userIdClaim)
                {
                    return Forbid();
                }

                var user = await _context.Users.FindAsync(actualUserId);
                if (user == null)
                {
                    return BadRequest(new { message = "Associated user not found." });
                }

                if (await _context.Customers.AnyAsync(c => c.UserId == actualUserId))
                {
                    return BadRequest(new { message = "Customer profile already exists for this user." });
                }
            }
            else
            {
                if (string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new { message = "Name and Email are required to create a new customer account." });
                }

                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                {
                    return BadRequest(new { message = "Email is already registered." });
                }

                // Default secure password for new admin-created customers
                string passwordHash = BCrypt.Net.BCrypt.HashPassword("Welcome123!");

                var newUser = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    Password = passwordHash,
                    Role = "Customer"
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();
                actualUserId = newUser.UserId;
            }

            var customer = new Customer
            {
                UserId = actualUserId,
                DOB = request.DOB,
                Gender = request.Gender,
                Phone = request.Phone,
                Address = request.Address,
                Aadhaar = request.Aadhaar,
                NomineeName = request.NomineeName,
                NomineeRelationship = request.NomineeRelationship
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var finalUser = await _context.Users.FindAsync(actualUserId);

            return CreatedAtAction(nameof(GetCustomer), new { id = customer.CustomerId }, new
            {
                customer.CustomerId,
                customer.UserId,
                Name = finalUser?.Name,
                Email = finalUser?.Email,
                customer.DOB,
                customer.Gender,
                customer.Phone,
                customer.Address,
                customer.Aadhaar,
                customer.NomineeName,
                customer.NomineeRelationship
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] CustomerUpdateRequest request)
        {
            // Validate age is 18 or above
            var today = DateTime.UtcNow.Date;
            var age = today.Year - request.DOB.Year;
            if (request.DOB.Date > today.AddYears(-age))
            {
                age--;
            }

            if (age < 18)
            {
                return BadRequest(new { message = "Customer must be 18 years of age or older to register." });
            }

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            if (userRole == "Customer" && customer.UserId.ToString() != userIdClaim)
            {
                return Forbid();
            }

            customer.DOB = request.DOB;
            customer.Gender = request.Gender;
            customer.Phone = request.Phone;
            customer.Address = request.Address;
            customer.Aadhaar = request.Aadhaar;
            customer.NomineeName = request.NomineeName;
            customer.NomineeRelationship = request.NomineeRelationship;

            _context.Entry(customer).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Customer profile updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin")
            {
                return Forbid();
            }

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            // 1. Get all policies belonging to the customer
            var policies = await _context.Policies.Where(p => p.CustomerId == id).ToListAsync();
            var policyIds = policies.Select(p => p.PolicyId).ToList();

            // 2. Remove related Payments, Claims, and Documents linked to those policies
            if (policyIds.Any())
            {
                var payments = await _context.Payments.Where(pm => policyIds.Contains(pm.PolicyId)).ToListAsync();
                _context.Payments.RemoveRange(payments);

                var claims = await _context.Claims.Where(cl => policyIds.Contains(cl.PolicyId)).ToListAsync();
                _context.Claims.RemoveRange(claims);

                var documents = await _context.Documents.Where(d => policyIds.Contains(d.PolicyId)).ToListAsync();
                _context.Documents.RemoveRange(documents);

                // Remove the Policies
                _context.Policies.RemoveRange(policies);
            }

            // 3. Remove customer-level claims directly linked to the customer id
            var customerClaims = await _context.Claims.Where(cl => cl.CustomerId == id).ToListAsync();
            if (customerClaims.Any())
            {
                _context.Claims.RemoveRange(customerClaims);
            }

            // 4. Finally remove the Customer profile
            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Customer profile and related policies/claims deleted successfully." });
        }
    }
}
