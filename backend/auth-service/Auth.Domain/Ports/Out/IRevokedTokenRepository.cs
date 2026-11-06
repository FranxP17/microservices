using Auth.Domain.Entities;

namespace Auth.Domain.Ports.Out
{
    public interface IRevokedTokenRepository
    {
        Task AddAsync(RevokedToken revokedToken);
        Task<RevokedToken> GetByIdAsync(Guid id);
        Task<List<RevokedToken>> GetByUserIdAsync(Guid userId);
        Task DeleteAsync(Guid id);
    }
}
