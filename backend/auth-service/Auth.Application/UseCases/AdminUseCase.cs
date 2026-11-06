using Auth.Application.Dtos;
using Auth.Application.Ports.In;
using Auth.Domain.Exceptions;
using Auth.Domain.Ports.Out;
using Auth.Domain.Enums;
using Auth.Domain.Entities;

namespace Auth.Application.UseCases
{
    public class AdminUseCase (IUserRespository userRespository, IPasswordHasher passwordHasher) : IAdminUseCase
    {
        private readonly IUserRespository _userRespository = userRespository;
        private readonly IPasswordHasher _passwordHasher = passwordHasher;

        public async Task<UserAllResponse> ExecuteUpdateUserAsync(Guid userId, AdminUpdateUserRequest request)
        {
            var user = await _userRespository.GetByIdSync(userId)
                ?? throw new UserNotFoundException("Usuario no encontrado.");

            var name = request.DisplayName.Trim();
            var email = request.Email.Trim();
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
                throw new InvalidParameterException("El nombre y el correo son obligatorios.");

            if (!Enum.TryParse<Role>(request.Role, true, out var role)
                || !Enum.IsDefined(role)
                || !Enum.GetNames<Role>().Contains(request.Role, StringComparer.OrdinalIgnoreCase))
                throw new InvalidParameterException("El rol especificado no es válido.");

            if (!Enum.TryParse<Status>(request.Status, true, out var status)
                || !Enum.IsDefined(status)
                || !Enum.GetNames<Status>().Contains(request.Status, StringComparer.OrdinalIgnoreCase))
                throw new InvalidParameterException("El estado especificado no es válido.");

            if (request.Password is not null && (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8))
                throw new InvalidParameterException("La contraseña debe tener al menos 8 caracteres.");

            var existing = await _userRespository.GetByEmailAsync(email);
            if (existing is not null && existing.Id != userId)
                throw new UserAlreadyExistsException("El email ya está en uso.");

            user.UpdateDisplayName(name);
            user.UpdateEmail(email);
            user.UpdateTel(request.Tel?.Trim() ?? "");
            user.UpdateAvatarUrl(request.AvatarUrl?.Trim() ?? "");
            user.UpdateRol(role.ToString());
            user.UpdateStatus(status.ToString());
            if (request.Password is not null)
                user.UpdatePassword(_passwordHasher.HashPassword(request.Password));

            await _userRespository.UpdateAsync(user);
            return ToResponse(user);
        }

        public async Task<UserAllResponse> ExecuteCreateUserAsync(AdminUpdateUserRequest request)
        {
            var name = request.DisplayName.Trim();
            var email = request.Email.Trim();
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
                throw new InvalidParameterException("El nombre y el correo son obligatorios.");
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                throw new InvalidParameterException("La contraseña debe tener al menos 8 caracteres.");
            if (!Enum.TryParse<Role>(request.Role, true, out var role)
                || !Enum.GetNames<Role>().Contains(request.Role, StringComparer.OrdinalIgnoreCase))
                throw new InvalidParameterException("El rol especificado no es válido.");
            if (!Enum.TryParse<Status>(request.Status, true, out var status)
                || !Enum.GetNames<Status>().Contains(request.Status, StringComparer.OrdinalIgnoreCase))
                throw new InvalidParameterException("El estado especificado no es válido.");
            if (await _userRespository.GetByEmailAsync(email) is not null)
                throw new UserAlreadyExistsException("El email ya está en uso.");

            var now = DateTime.UtcNow;
            var user = new User(Guid.NewGuid(), email, _passwordHasher.HashPassword(request.Password),
                name, request.AvatarUrl?.Trim() ?? "", false, request.Tel?.Trim() ?? "",
                role, status, now, now);
            await _userRespository.AddAsync(user);
            return ToResponse(user);
        }

        public async Task ExecuteDeleteUserAsync(Guid userId)
        {
            var user = await _userRespository.GetByIdSync(userId)
                ?? throw new UserNotFoundException("Usuario no encontrado.");
            await _userRespository.DeleteAsync(user);
        }

        private static UserAllResponse ToResponse(User user)
        {
            return new UserAllResponse
            {
                Id = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName ?? "",
                AvatarUrl = user.AvatarUrl ?? "",
                Tel = user.Tel ?? "",
                Role = user.Role,
                Status = user.Status,
                CreatedAt = user.Created_at,
                UpdatedAt = user.Updated_at
            };
        }

        public async Task<UserResponse> ExecuteChangeRolAsync(Guid userId, ChangeRolRequest request)
        {
            var user = await _userRespository.GetByIdSync(userId) ?? 
                throw new UserNotFoundException("Usuario no encontrado.");

            user.UpdateRol(request.Rol);
            await _userRespository.UpdateAsync(user);
            return new UserResponse { Message = "Rol actualizado." };
        }

        public async Task<UserResponse> ExecuteChangeStatusAsync(Guid userId, ChangeStatusRequest request)
        {
            var user = await _userRespository.GetByIdSync(userId) ??
                throw new UserNotFoundException("Usuario no encontrado.");

            user.UpdateStatus(request.Status);
            await _userRespository.UpdateAsync(user);
            return new UserResponse { Message = "Estado actualizado." };
        }
    }
}
