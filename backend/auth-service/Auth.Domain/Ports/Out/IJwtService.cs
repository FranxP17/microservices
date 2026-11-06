using Auth.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Auth.Domain.Ports.Out
{
    public interface IJwtService
    {
        public string GenerateAccessToken(User user, Guid? sessionId = null);
        public string GenerateRefreshToken();
        public string GenerateToken(User user);
    }
}
