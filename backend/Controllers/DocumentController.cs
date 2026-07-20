using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InsuranceApi.Data;
using InsuranceApi.Models;
using InsuranceApi.Services;
using System;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentController : ControllerBase
    {
        private readonly InsuranceDbContext _context;
        private readonly IFileStorageService _fileStorageService;

        public DocumentController(InsuranceDbContext context, IFileStorageService fileStorageService)
        {
            _context = context;
            _fileStorageService = fileStorageService;
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadDocument([FromForm] int policyId, [FromForm] string documentType, [FromForm] int? claimId, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            var policy = await _context.Policies.FindAsync(policyId);
            if (policy == null)
            {
                return NotFound(new { message = "Policy not found." });
            }

            var relativePath = await _fileStorageService.SaveFileAsync(file, $"policy_{policyId}");

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Customer";
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

            var document = new Document
            {
                PolicyId = policyId,
                ClaimId = claimId,
                FileName = file.FileName,
                FilePath = relativePath,
                UploadDate = DateTime.UtcNow,
                DocumentType = documentType,
                Status = "Pending",
                UploadedByName = userName,
                UploadedByRole = userRole
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Document uploaded successfully.", document });
        }

        [HttpGet("policy/{policyId}")]
        public async Task<IActionResult> GetDocumentsByPolicy(int policyId)
        {
            var policy = await _context.Policies.FindAsync(policyId);
            if (policy == null)
            {
                return NotFound(new { message = "Policy not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null || policy.CustomerId != customer.CustomerId)
                {
                    return Forbid();
                }
            }

            var documents = await _context.Documents
                .Where(d => d.PolicyId == policyId)
                .Select(d => new
                {
                    d.DocumentId,
                    d.PolicyId,
                    d.ClaimId,
                    d.FileName,
                    d.UploadDate,
                    d.DocumentType,
                    d.Status,
                    d.ReviewComment,
                    d.UploadedByName,
                    d.UploadedByRole,
                    DownloadUrl = $"/api/document/{d.DocumentId}"
                })
                .ToListAsync();

            return Ok(documents);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var document = await _context.Documents
                .Include(d => d.Policy)
                .FirstOrDefaultAsync(d => d.DocumentId == id);

            if (document == null)
            {
                return NotFound(new { message = "Document not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer" && document.Policy?.CustomerId != null)
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null || document.Policy.CustomerId != customer.CustomerId)
                {
                    return Forbid();
                }
            }

            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), document.FilePath);
            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound(new { message = "Physical file not found on server." });
            }

            var memory = new MemoryStream();
            using (var stream = new FileStream(fullPath, FileMode.Open))
            {
                await stream.CopyToAsync(memory);
            }
            memory.Position = 0;

            var contentType = "application/octet-stream";
            var ext = Path.GetExtension(fullPath).ToLowerInvariant();
            if (ext == ".pdf") contentType = "application/pdf";
            else if (ext == ".png") contentType = "image/png";
            else if (ext == ".jpg" || ext == ".jpeg") contentType = "image/jpeg";

            return File(memory, contentType, document.FileName);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var document = await _context.Documents
                .Include(d => d.Policy)
                .FirstOrDefaultAsync(d => d.DocumentId == id);

            if (document == null)
            {
                return NotFound(new { message = "Document not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer" && document.Policy?.CustomerId != null)
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null || document.Policy.CustomerId != customer.CustomerId)
                {
                    return Forbid();
                }
            }

            _fileStorageService.DeleteFile(document.FilePath);

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Document deleted successfully." });
        }

        [HttpGet("claim/{claimId}")]
        public async Task<IActionResult> GetDocumentsByClaim(int claimId)
        {
            var claim = await _context.Claims.FindAsync(claimId);
            if (claim == null)
            {
                return NotFound(new { message = "Claim not found." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;

            if (userRole == "Customer")
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId.ToString() == userIdClaim);
                if (customer == null || claim.CustomerId != customer.CustomerId)
                {
                    return Forbid();
                }
            }

            var documents = await _context.Documents
                .Where(d => d.ClaimId == claimId)
                .Select(d => new
                {
                    d.DocumentId,
                    d.PolicyId,
                    d.ClaimId,
                    d.FileName,
                    d.UploadDate,
                    d.DocumentType,
                    d.Status,
                    d.ReviewComment,
                    d.UploadedByName,
                    d.UploadedByRole,
                    DownloadUrl = $"/api/document/{d.DocumentId}"
                })
                .ToListAsync();

            return Ok(documents);
        }

        [HttpPut("{id}/verify")]
        public async Task<IActionResult> VerifyDocument(int id, [FromBody] DocumentVerifyRequest request)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Agent")
            {
                return Forbid();
            }

            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound(new { message = "Document not found." });
            }

            var allowedStatuses = new[] { "Pending", "Verified", "Rejected" };
            if (!allowedStatuses.Contains(request.Status))
            {
                return BadRequest(new { message = "Invalid status. Allowed: Pending, Verified, Rejected" });
            }

            document.Status = request.Status;
            document.ReviewComment = request.ReviewComment;

            await _context.SaveChangesAsync();

            if (userRole == "Agent")
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
                var user = await _context.Users.FindAsync(int.Parse(userIdClaim));
                if (user != null)
                {
                    await AuditLogger.LogActionAsync(_context, user.UserId, user.Name, 
                        "Verify Document", 
                        $"Agent verified Document #{id} (Type: {document.DocumentType}, Status: '{request.Status}'). Review comment: \"{request.ReviewComment}\".");
                }
            }

            return Ok(new { message = "Document verification updated successfully.", document });
        }
    }

    public class DocumentVerifyRequest
    {
        public required string Status { get; set; }
        public string? ReviewComment { get; set; }
    }
}
