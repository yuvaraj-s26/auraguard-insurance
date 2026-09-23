using Microsoft.EntityFrameworkCore;
using InsuranceApi.Models;
using System;

namespace InsuranceApi.Data
{
    public class InsuranceDbContext : DbContext
    {
        public InsuranceDbContext(DbContextOptions<InsuranceDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<PolicyType> PolicyTypes { get; set; }
        public DbSet<Policy> Policies { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Claim> Claims { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<ClaimComment> ClaimComments { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Password).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            });

            // Customer configuration
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasKey(e => e.CustomerId);
                entity.Property(e => e.Gender).IsRequired().HasMaxLength(10);
                entity.Property(e => e.Phone).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Address).IsRequired().HasColumnType("text");
                entity.Property(e => e.Aadhaar).IsRequired().HasMaxLength(12);
                entity.Property(e => e.NomineeName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.NomineeRelationship).IsRequired().HasMaxLength(50);

                // Relationship: User -> Customer (1-to-1)
                entity.HasOne(c => c.User)
                      .WithMany()
                      .HasForeignKey(c => c.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // PolicyType configuration
            modelBuilder.Entity<PolicyType>(entity =>
            {
                entity.HasKey(e => e.PolicyTypeId);
                entity.Property(e => e.PolicyName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).IsRequired().HasColumnType("text");
                entity.Property(e => e.Coverage).HasPrecision(18, 2);
                entity.Property(e => e.PremiumRate).HasPrecision(18, 4);
            });

            // Policy configuration
            modelBuilder.Entity<Policy>(entity =>
            {
                entity.HasKey(e => e.PolicyId);
                entity.Property(e => e.PolicyNumber).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.PolicyNumber).IsUnique();
                entity.Property(e => e.Premium).HasPrecision(18, 2);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);

                // Relationship: Customer -> Policies (1-to-many)
                entity.HasOne(p => p.Customer)
                      .WithMany()
                      .HasForeignKey(p => p.CustomerId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relationship: PolicyType -> Policies (1-to-many)
                entity.HasOne(p => p.PolicyType)
                      .WithMany()
                      .HasForeignKey(p => p.PolicyTypeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Payment configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);
                entity.Property(e => e.Amount).HasPrecision(18, 2);
                entity.Property(e => e.PaymentMode).IsRequired().HasMaxLength(50);
                entity.Property(e => e.TransactionId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);

                // Relationship: Policy -> Payments (1-to-many)
                entity.HasOne(p => p.Policy)
                      .WithMany()
                      .HasForeignKey(p => p.PolicyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Claim configuration
            modelBuilder.Entity<Claim>(entity =>
            {
                entity.HasKey(e => e.ClaimId);
                entity.Property(e => e.ClaimAmount).HasPrecision(18, 2);
                entity.Property(e => e.Description).IsRequired().HasColumnType("text");
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.Property(e => e.RulesCheckResult).IsRequired().HasMaxLength(20).HasDefaultValue("Not Run");
                entity.Property(e => e.RulesCheckReason).HasColumnType("text");
                entity.Property(e => e.FraudRiskScore).HasDefaultValue(15);
                entity.Property(e => e.FraudRiskLevel).HasMaxLength(20).HasDefaultValue("Low");
                entity.Property(e => e.FraudRiskFactors).HasColumnType("text");

                // Relationship: Policy -> Claims (1-to-many)
                entity.HasOne(c => c.Policy)
                      .WithMany()
                      .HasForeignKey(c => c.PolicyId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Relationship: Customer -> Claims (1-to-many)
                entity.HasOne(c => c.Customer)
                      .WithMany()
                      .HasForeignKey(c => c.CustomerId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Document configuration
            modelBuilder.Entity<Document>(entity =>
            {
                entity.HasKey(e => e.DocumentId);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
                entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Pending");
                entity.Property(e => e.ReviewComment).HasMaxLength(255);
                entity.Property(e => e.UploadedByName).HasMaxLength(100);
                entity.Property(e => e.UploadedByRole).HasMaxLength(20);

                // Relationship: Policy -> Documents (1-to-many)
                entity.HasOne(d => d.Policy)
                      .WithMany()
                      .HasForeignKey(d => d.PolicyId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Relationship: Claim -> Documents (1-to-many, optional)
                entity.HasOne(d => d.Claim)
                      .WithMany()
                      .HasForeignKey(d => d.ClaimId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ClaimComment configuration
            modelBuilder.Entity<ClaimComment>(entity =>
            {
                entity.HasKey(e => e.ClaimCommentId);
                entity.Property(e => e.Message).IsRequired().HasColumnType("text");
                entity.Property(e => e.AuthorName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.AuthorRole).IsRequired().HasMaxLength(20);

                // Relationship: Claim -> Comments (1-to-many)
                entity.HasOne(cc => cc.Claim)
                      .WithMany()
                      .HasForeignKey(cc => cc.ClaimId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Relationship: User -> Comments (1-to-many)
                entity.HasOne(cc => cc.User)
                      .WithMany()
                      .HasForeignKey(cc => cc.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // AuditLog configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.AuditLogId);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Details).IsRequired().HasColumnType("text");
                entity.Property(e => e.AgentName).IsRequired().HasMaxLength(100);

                // Relationship: User -> AuditLogs
                entity.HasOne(a => a.User)
                      .WithMany()
                      .HasForeignKey(a => a.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed default Policy Types
            modelBuilder.Entity<PolicyType>().HasData(
                new PolicyType { PolicyTypeId = 1, PolicyName = "Life Secure Term Plan", Description = "Comprehensive term life insurance covering death, disability, and critical illnesses.", Coverage = 1000000.00m, PremiumRate = 0.005m },
                new PolicyType { PolicyTypeId = 2, PolicyName = "Health Guard Premium", Description = "Family floater health insurance with zero copay, cover for pre & post hospitalization.", Coverage = 500000.00m, PremiumRate = 0.02m },
                new PolicyType { PolicyTypeId = 3, PolicyName = "Motor Vehicle Policy", Description = "Third-party and comprehensive damage cover for passenger cars and commercial vehicles.", Coverage = 300000.00m, PremiumRate = 0.015m },
                new PolicyType { PolicyTypeId = 4, PolicyName = "Property Protection Plan", Description = "Insurance cover for residential properties against fire, burglary, and natural calamities.", Coverage = 2500000.00m, PremiumRate = 0.003m }
            );

            // Seed admin and agent users. Note: Passwords will be pre-hashed using BCrypt.
            // Hashed "admin123" -> "$2a$11$wK1F5Q.Zk8Kz/HwQ7r3GTeJmH0R7Fp5.q7QkK.sC4eR3Y/xG.JgIe" (actually we'll hash programmatically at runtime, or we seed a hashed value here)
            // Hashed "agent123"  -> "$2a$11$F7T5iS1GvP2T5K3l2eE/eeU4Bw2T5L3e1Q7kK.sC4eR3Y/xG.JgIe"
            // For seeding, let's use standard hashes for simplicity
            modelBuilder.Entity<User>().HasData(
                new User { UserId = 1, Name = "System Admin", Email = "admin@insurance.com", Password = BCrypt.Net.BCrypt.HashPassword("admin123"), Role = "Admin" },
                new User { UserId = 2, Name = "John Agent", Email = "agent@insurance.com", Password = BCrypt.Net.BCrypt.HashPassword("agent123"), Role = "Agent" }
            );
        }
    }
}
