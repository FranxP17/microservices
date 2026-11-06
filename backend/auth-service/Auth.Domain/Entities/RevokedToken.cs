namespace Auth.Domain.Entities
{
    public class RevokedToken(
            Guid jti,
            Guid userId,
            DateTime revokedAt,
            DateTime expiresAt
        )
    {
        public Guid Jti { get; set; } = jti;
        public Guid UserId { get; set; } = userId;
        public DateTime RevokedAt { get; set; } = revokedAt;
        public DateTime ExpiresAt { get; set; } = expiresAt;
    }
}
