namespace Auth.Application.Dtos
{
    public class UserDetailResponse
    {
        public required Guid Id { get; set; }
        public required string Email { get; set; }
        public required string Name { get; set; }
        public required string Role { get; set; }
        public required string Status { get; set; }
    }
}
