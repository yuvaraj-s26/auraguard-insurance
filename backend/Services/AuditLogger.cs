using InsuranceApi.Data;
using InsuranceApi.Models;
using System;
using System.Threading.Tasks;

namespace InsuranceApi.Services
{
    public static class AuditLogger
    {
        public static async Task LogActionAsync(InsuranceDbContext context, int userId, string agentName, string action, string details)
        {
            try
            {
                var log = new AuditLog
                {
                    UserId = userId,
                    AgentName = agentName,
                    Action = action,
                    Details = details,
                    Timestamp = DateTime.UtcNow
                };
                context.AuditLogs.Add(log);
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuditLogger Error] {ex.Message}");
            }
        }
    }
}
