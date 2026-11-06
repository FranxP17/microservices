using System.ComponentModel.DataAnnotations;

namespace Auth.Application.Dtos
{
    public class AdminUpdateUserRequest
    {
        [Required, StringLength(100)]
        public string DisplayName { get; set; } = "";

        [Required, EmailAddress, StringLength(150)]
        public string Email { get; set; } = "";

        public string? Tel { get; set; }
        public string? AvatarUrl { get; set; }

        [Required]
        public string Role { get; set; } = "";

        [Required]
        public string Status { get; set; } = "";

        [MinLength(8)]
        public string? Password { get; set; }
    }
}
