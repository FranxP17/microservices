using Auth.Domain.Entities;
using Auth.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Auth.Infrastructure.Persistence
{
    public class UsersDbContext(DbContextOptions<UsersDbContext> options) : DbContext(options)
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<RevokedToken> RevokedTokens => Set<RevokedToken>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(e =>
            {
                e.ToTable("Users");
                e.HasKey(x => x.Id);
                e.Property(x => x.Email).HasColumnName("email").HasColumnType("varchar(150)");
                e.Property(x => x.DisplayName).HasColumnName("displayName").HasColumnType("varchar(100)");
                e.Property(x => x.Password).HasColumnName("password").HasColumnType("varchar(150)");
                e.Property(x => x.Role).HasColumnName("role").HasColumnType("enum('JOYENT', 'CRITIC', 'ADMIN')").HasDefaultValue(Role.JOYENT).ValueGeneratedNever();
                e.Property(x => x.Status).HasColumnName("status").HasColumnType("enum('ACTIVE', 'INACTIVE', 'BLOCKED')").HasDefaultValue(Status.ACTIVE).ValueGeneratedNever();
                e.Property(x => x.EmailConfirmed).HasColumnName("email_confirmed").HasDefaultValue(true).ValueGeneratedNever();
                e.Property(x => x.Tel).HasColumnName("tel").HasColumnType("text");
                e.Property(x => x.Created_at).HasColumnName("created_at").HasColumnType("timestamp").HasDefaultValue(DateTime.Now).ValueGeneratedNever();
                e.Property(x => x.Updated_at).HasColumnName("updated_at").HasColumnType("timestamp").HasDefaultValue(DateTime.Now).ValueGeneratedNever();
                e.Property(x => x.AvatarUrl).HasColumnName("AvatarUrl").HasDefaultValue("").ValueGeneratedNever();
            });

            modelBuilder.Entity<RevokedToken>(e =>
            {
                e.ToTable("revoked_tokens");
                e.HasKey(x => x.Jti);
                e.Property(x => x.UserId).HasColumnName("user_id").HasColumnType("char(36)");
                e.Property(x => x.RevokedAt).HasColumnName("revoked_at").HasColumnType("timestamp").HasDefaultValue(DateTime.Now).ValueGeneratedNever();
                e.Property(x => x.ExpiresAt).HasColumnName("expires_at").HasColumnType("timestamp").HasDefaultValue(DateTime.Now.AddDays(7)).ValueGeneratedNever();
            });
        }
    }
}
