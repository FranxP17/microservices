using Auth.Domain.Entities;

namespace Auth.Domain.Ports.Out
{
    public interface IUserRespository
    {
        Task AddAsync(User user);
        Task DeleteAsync(User user);
        Task UpdateAsync(User user);
        Task<User?> GetByIdSync(Guid id);
        Task<bool> ExitsByIdSync(Guid id);
        Task<List<User>> GetByUsersAsync(int page, int limit);
        Task<User?> GetByEmailAsync(string email);
        Task<bool> ExistByEmailUserAsync(string email);
    }
}
