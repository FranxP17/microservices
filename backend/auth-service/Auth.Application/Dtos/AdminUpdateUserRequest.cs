using System.ComponentModel.DataAnnotations;

namespace Auth.Application.Dtos
{
    public class AdminUpdateUserRequest
    {
        [Required, StringLength(100)]
        public string Name { get; set; } = "";

        [Required, EmailAddress, StringLength(150)]
        public string Email { get; set; } = "";

        public string? Tel { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
