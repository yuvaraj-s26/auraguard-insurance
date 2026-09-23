using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InsuranceApi.Models;

namespace InsuranceApi.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(InsuranceDbContext context)
        {
            // 1. Seed Policy Types if none exist
            if (!await context.PolicyTypes.AnyAsync())
            {
                var policyTypes = new[]
                {
                    new PolicyType
                    {
                        PolicyName = "Life Secure Term Plan",
                        Description = "Comprehensive financial security for your family with high coverage limits and flexible settlement options.",
                        Coverage = 1000000m,
                        PremiumRate = 0.005m
                    },
                    new PolicyType
                    {
                        PolicyName = "Health Guard Premium",
                        Description = "Complete medical hospitalization protection with cashless hospital network access, zero copay, and critical illness add-ons.",
                        Coverage = 500000m,
                        PremiumRate = 0.02m
                    },
                    new PolicyType
                    {
                        PolicyName = "Motor Vehicle Policy",
                        Description = "Comprehensive protection against vehicular accidental damage, third-party bodily liability, theft, and natural perils.",
                        Coverage = 300000m,
                        PremiumRate = 0.015m
                    },
                    new PolicyType
                    {
                        PolicyName = "Property Protection Plan",
                        Description = "All-risk structural and residential asset indemnity against fire, seismic activity, storm damage, and burglaries.",
                        Coverage = 2500000m,
                        PremiumRate = 0.003m
                    }
                };

                await context.PolicyTypes.AddRangeAsync(policyTypes);
                await context.SaveChangesAsync();
            }

            // 2. Seed Default Administrator if not present
            if (!await context.Users.AnyAsync(u => u.Email == "yuvaraj@insurance.com"))
            {
                var adminUser = new User
                {
                    Name = "Yuvaraj Administrator",
                    Email = "yuvaraj@insurance.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("Yuva@123"),
                    Role = "Admin",
                    IsApproved = true
                };

                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
            }

            // 3. Seed Default Agent if not present
            if (!await context.Users.AnyAsync(u => u.Email == "praveen@insurance.com"))
            {
                var agentUser = new User
                {
                    Name = "Praveen Agent",
                    Email = "praveen@insurance.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("Praveen@123"),
                    Role = "Agent",
                    IsApproved = true
                };

                await context.Users.AddAsync(agentUser);
                await context.SaveChangesAsync();
            }

            // 4. Seed Demo Customer if not present
            if (!await context.Users.AnyAsync(u => u.Email == "raj@insurance.com"))
            {
                var customerUser = new User
                {
                    Name = "Raj Kumar",
                    Email = "raj@insurance.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("Raj@123"),
                    Role = "Customer",
                    IsApproved = true
                };

                await context.Users.AddAsync(customerUser);
                await context.SaveChangesAsync();

                // Create Customer Profile
                var customerProfile = new Customer
                {
                    UserId = customerUser.UserId,
                    DOB = new DateTime(1994, 6, 15),
                    Gender = "Male",
                    Phone = "+91 9876543210",
                    Address = "742 Evergreen Terrace, Sector 4, Bangalore",
                    Aadhaar = "987654321012",
                    NomineeName = "Priya Kumar",
                    NomineeRelationship = "Spouse"
                };

                await context.Customers.AddAsync(customerProfile);
                await context.SaveChangesAsync();

                // Create a Starter Active Policy for the Demo Customer
                var healthType = await context.PolicyTypes.FirstOrDefaultAsync(pt => pt.PolicyName.Contains("Health"));
                if (healthType != null)
                {
                    var demoPolicy = new Policy
                    {
                        PolicyNumber = "POL-HG-984210",
                        CustomerId = customerProfile.CustomerId,
                        PolicyTypeId = healthType.PolicyTypeId,
                        StartDate = DateTime.UtcNow.AddMonths(-2),
                        EndDate = DateTime.UtcNow.AddMonths(10),
                        Premium = 10000m,
                        Status = "Active"
                    };

                    await context.Policies.AddAsync(demoPolicy);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
