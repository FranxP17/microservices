namespace Auth.Application.Dtos
{
    public class LoginResponse
    {
        public required Guid UserId { get; set; }
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Role { get; set; }
        public required string AccessToken { get; set; }
    }
}