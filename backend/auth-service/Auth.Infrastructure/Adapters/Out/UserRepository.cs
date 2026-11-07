using Auth.Domain.Entities;
using Auth.Domain.Ports.Out;
using Auth.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Auth.Infrastructure.Adapters.Out
{
    public class UserRepository(UsersDbContext context) : IUserRespository
    {
        private readonly UsersDbContext _context = context;
        public async Task AddAsync(User user)
        {
            await _context.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(User user)
        {
            _context.Remove(user);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistByEmailUserAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<bool> ExitsByIdSync(Guid id)
        {
            return await _context.Users.AnyAsync(u => u.Id == id);
        }

        public Task<User?> GetByEmailAsync(string email)
        {
            return _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public Task<User?> GetByIdSync(Guid id)
        {
            return _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        }

        public Task<List<User>> GetByUsersAsync(int page, int limit)
        {
            return _context.Users
                .AsNoTracking()
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();
        }

        public Task<int> GetTotalUsersAsync()
        {
            return _context.Users.CountAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _context.Update(user);
            await _context.SaveChangesAsync();
        }
    }
}
