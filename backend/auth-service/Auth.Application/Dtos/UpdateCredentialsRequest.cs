namespace Auth.Application.Dtos
{
    public class UpdateCredentialsRequest
    {
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Tel { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
