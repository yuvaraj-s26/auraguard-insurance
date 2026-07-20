using System;

namespace InsuranceApi.Models
{
    public class AuditLog
    {
        public int AuditLogId { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public required string AgentName { get; set; }
        public required string Action { get; set; }
        public required string Details { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
