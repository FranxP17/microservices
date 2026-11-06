using Auth.Domain.Ports.Out;

namespace Auth.Infrastructure.Security
{
    public class PasswordHasher : IPasswordHasher
    {
        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public Task<bool> VerifyPasswordAsync(string password, string hashedPassword)
        {
            return Task.FromResult(BCrypt.Net.BCrypt.Verify(password, hashedPassword));
        }
    }
}
