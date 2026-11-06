using Auth.Domain.Entities;
using Auth.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Auth.Application.Dtos
{
    public class UsersReponse
    {
        public List<UserAllResponse> Data { get; set; } = [];
        public int TotalCount { get; set; }
    }

    public class UserAllResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string AvatarUrl { get; set; } = "";
        public string Tel { get; set; } = "";
        public Role Role { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
