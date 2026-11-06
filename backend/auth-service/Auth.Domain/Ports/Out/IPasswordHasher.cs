using System;
using System.Collections.Generic;
using System.Text;

namespace Auth.Domain.Ports.Out
{
    public interface IPasswordHasher
    {
        public string HashPassword(string password);
        public Task<bool> VerifyPasswordAsync(string password, string hashedPassword);
    }
}
