using System.Text.Json.Serialization;

namespace Auth.Application.Dtos
{
    public class CreateRequest
    {
        public required string DisplayName { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public long Tel { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
