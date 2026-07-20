using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InsuranceApi.Data;
using InsuranceApi.Models;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AuditLogController : ControllerBase
    {
        private readonly InsuranceDbContext _context;

        public AuditLogController(InsuranceDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin")
            {
                return Forbid();
            }
            var logs = await _context.AuditLogs
                .OrderByDescending(l => l.Timestamp)
                .Select(l => new
                {
                    l.AuditLogId,
                    l.AgentName,
                    l.Action,
                    l.Details,
                    l.Timestamp
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
