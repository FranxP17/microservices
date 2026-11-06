using Auth.Domain.Entities;
using Auth.Domain.Ports.Out;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Auth.Infrastructure.Security
{
    public class JwtService : IJwtService
    {

        public string GenerateAccessToken(User user, Guid? sessionId = null)
        {
            var key = Environment.GetEnvironmentVariable("JWT_KEY")
                ?? throw new InvalidOperationException("Jwt no configurado");
            var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
            var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");
            var expiresMinutes =
                int.TryParse(Environment.GetEnvironmentVariable("JWT_EXPIRYMINUTES"),
                    out var minutes)
                ? minutes
                : 60;

            var claims = new List<Claim> {
                new(
                    JwtRegisteredClaimNames.Sub,
                    user.Id.ToString()
                ),
                new("name", user.DisplayName ?? string.Empty),
                new(
                    JwtRegisteredClaimNames.Email,
                    user.Email
                ),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(
                    ClaimTypes.Role,
                    user.Role.ToString()
                )
            };

            if (sessionId.HasValue)
                claims.Add(new Claim("sid", sessionId.Value.ToString()));

            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key)
            );

            var credentials = new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');
        }

        public string GenerateToken(User user)
        {
            return GenerateAccessToken(user);
        }
    }
}
