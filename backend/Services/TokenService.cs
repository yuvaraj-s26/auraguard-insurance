using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using InsuranceApi.Models;

namespace InsuranceApi.Services
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }

    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateToken(User user)
        {
            var secretKey = _config["Jwt:Key"] ?? "super_secret_key_that_is_at_least_32_characters_long_insurance_system";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<System.Security.Claims.Claim>
            {
                new System.Security.Claims.Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new System.Security.Claims.Claim(ClaimTypes.Email, user.Email),
                new System.Security.Claims.Claim(ClaimTypes.Name, user.Name),
                new System.Security.Claims.Claim(ClaimTypes.Role, user.Role),
                new System.Security.Claims.Claim("userId", user.UserId.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"] ?? "InsuranceApi",
                audience: _config["Jwt:Audience"] ?? "InsuranceReactClient",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
