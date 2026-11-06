using Auth.Domain.Entities;
using Auth.Domain.Ports.Out;
using Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Auth.Infrastructure.Adapters.Out
{
    public class RevokedTokenRepository(UsersDbContext context) : IRevokedTokenRepository
    {
        private readonly UsersDbContext _context = context;

        public async Task AddAsync(RevokedToken revokedToken)
        {
            await _context.RevokedTokens.AddAsync(revokedToken);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var revokedToken = await _context.RevokedTokens.FirstOrDefaultAsync(rt => rt.Jti == id) ?? throw new Exception("Token no encontrado");
            _context.RevokedTokens.Remove(revokedToken);
            await _context.SaveChangesAsync();
        }

        public async Task<RevokedToken> GetByIdAsync(Guid id)
        {
           return await _context.RevokedTokens.FirstOrDefaultAsync(rt => rt.Jti == id) ?? throw new Exception("Token no encontrado");
        }

        public async Task<List<RevokedToken>> GetByUserIdAsync(Guid userId)
        {
            return await _context.RevokedTokens.Where(rt => rt.UserId == userId).ToListAsync();
        }
    }
}
