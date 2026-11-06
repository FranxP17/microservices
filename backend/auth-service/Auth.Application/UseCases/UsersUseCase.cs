using Auth.Application.Dtos;
using Auth.Application.Ports.In;
using Auth.Domain.Exceptions;
using Auth.Domain.Ports.Out;

namespace Auth.Application.UseCases
{
    public class UsersUseCase(IUserRespository userRespository, IPasswordHasher passwordHasher) : IUsersUseCase
    {
        private readonly IUserRespository _userRespository = userRespository;
        private readonly IPasswordHasher _passwordHasher = passwordHasher;

        public async Task<UserResponse> ExecuteUpdateCredentialsAsync(Guid userId, UpdateCredentialsRequest request)
        {
            var user = await _userRespository.GetByIdSync(userId)
                ?? throw new UserNotFoundException("Usuario no encontrado");

            var hasName = !string.IsNullOrWhiteSpace(request.DisplayName);
            var hasEmail = !string.IsNullOrWhiteSpace(request.Email);
            var hasPassword = !string.IsNullOrWhiteSpace(request.Password);
            var hasTel = !string.IsNullOrWhiteSpace(request.Tel);

            if (!hasEmail && !hasPassword && !hasName && !hasTel)
                throw new InvalidParameterException("Debes enviar al menos un campo para actualizar.");

            if (hasEmail)
            {
                var normalizedEmail = request.Email!.Trim();
                var userByEmail = await _userRespository.GetByEmailAsync(normalizedEmail);
                if (userByEmail is not null && userByEmail.Id != userId)
                    throw new UserAlreadyExistsException("El email ya está en uso.");

                user.UpdateEmail(normalizedEmail);
            }

            if (hasPassword)
            {
                var passwordHash = _passwordHasher.HashPassword(request.Password!);
                user.UpdatePassword(passwordHash);
            }

            if (hasName)
            {
                user.UpdateDisplayName(request.DisplayName!);
            }
             
            if (hasTel)
            {
                user.UpdateTel(request.Tel!);
            }

            await _userRespository.UpdateAsync(user);

            return new UserResponse
            {
                Message = "Credenciales actualizadas correctamente."
            };
        }

        public async Task<UserResponse> ExecuteDeleteMyAccountAsync(Guid userId)
        {
            var user = await _userRespository.GetByIdSync(userId)
                ?? throw new UserNotFoundException("Usuario no encontrado");

            await _userRespository.DeleteAsync(user);

            return new UserResponse
            {
                Message = "Cuenta eliminada correctamente."
            };
        }

        public async Task<UserDetailResponse> ExecuteGetUserByIdAsync(Guid userId)
        {
            var user = await _userRespository.GetByIdSync(userId)
                ?? throw new UserNotFoundException("Usuario no encontrado");

            return new UserDetailResponse
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.DisplayName ?? string.Empty,
                Role = user.Role.ToString(),
                Status = user.Status.ToString()
            };
        }

        public async Task<UsersReponse> ExecuteGetByUsersAsync(int page, int limit)
        {
            if (page < 1) throw new InvalidParameterException("La página debe ser mayor o igual a 1");
            if (limit < 1) throw new InvalidParameterException("El límite debe ser mayor o igual a 1");

            var users = await _userRespository.GetByUsersAsync(page, limit);
            var totalCount = users.Count;

            return new UsersReponse
            {
                TotalCount = totalCount,
                Data = [.. users.Select(user => new UserAllResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    DisplayName = user.DisplayName ?? string.Empty,
                    AvatarUrl = user.AvatarUrl ?? string.Empty,
                    Tel = user.Tel ?? string.Empty,
                    Role = user.Role,
                    Status = user.Status,
                    CreatedAt = user.Created_at,
                    UpdatedAt = user.Updated_at
                })]
            };
        }
    }
}
