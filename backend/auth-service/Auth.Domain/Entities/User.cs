using Auth.Domain.Enums;

namespace Auth.Domain.Entities
{
    public class User
        (
            Guid id,
            string email,
            string password,
            string? displayName,
            string? avatarUrl,
            bool emailConfirmed,
            string? Tel,
            Role role,
            Status status,
            DateTime created_at,
            DateTime updated_at
        )
    {
        public Guid Id { get; private set; } = id;
        public string Email { get; private set; } = email;
        public string Password { get; private set; } = password;
        public string? DisplayName { get; private set; } = displayName;
        public string? AvatarUrl { get; private set; } = avatarUrl;
        public bool EmailConfirmed { get; private set; } = emailConfirmed;
        public string? Tel { get; private set; } = Tel;
        public Role Role { get; private set; } = role;
        public Status Status { get; private set; } = status;
        public DateTime Created_at { get; private set; } = created_at;
        public DateTime Updated_at { get; private set; } = updated_at;

        public void UpdateDisplayName(string v)
        {
            this.DisplayName = v;
            Updated_at = DateTime.UtcNow;
        }

        public void UpdateEmail(string email)
        {
            Email = email;
            Updated_at = DateTime.UtcNow;
        }

        public void UpdatePassword(string passwordHash)
        {
            Password = passwordHash;
            Updated_at = DateTime.UtcNow;
        }

        public void UpdateTel(string v)
        {
            this.Tel = v;
            Updated_at = DateTime.UtcNow;
        }

        public void UpdateAvatarUrl(string v)
        {
            AvatarUrl = v;
            Updated_at = DateTime.UtcNow;
        }

        public void UpdateRol(string rol)
        {
            if (!Enum.TryParse<Role>(rol,true, out var newRole))
            {
                throw new ArgumentException("El rol especificado no es válido");
            }
            this.Role = newRole;
            Updated_at = DateTime.UtcNow;
        }

        public void UpdateStatus(string status)
        {
            if (!Enum.TryParse<Status>(status, true, out var newStatus))
            {
                throw new ArgumentException("El estado especificado no es válido");
            }
            this.Status = newStatus;
            Updated_at = DateTime.UtcNow;
        }
    }
}
