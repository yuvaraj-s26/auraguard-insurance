using System;

namespace InsuranceApi.Models
{
    public class ClaimComment
    {
        public int ClaimCommentId { get; set; }
        public int ClaimId { get; set; }
        public Claim? Claim { get; set; }
        
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public required string Message { get; set; }
        public DateTime CommentDate { get; set; }
        public required string AuthorName { get; set; }
        public required string AuthorRole { get; set; }
        public bool IsPrivate { get; set; }
    }
}
