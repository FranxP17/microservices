using Auth.Application.Dtos;
using Auth.Application.Ports.In;
using Auth.Domain.Entities;
using Auth.Domain.Enums;
using Auth.Domain.Exceptions;
using Auth.Domain.Ports.Out;

namespace Auth.Application.UseCases
{
    public class AuthUseCase(IUserRespository userRespository, IRevokedTokenRepository revokedTokenRepository, IPasswordHasher passwordHasher, IJwtService jwtService) : IAuthUseCase
    {
        private readonly IUserRespository _userRespository = userRespository;
        private readonly IRevokedTokenRepository _revokedTokenRepository = revokedTokenRepository;
        private readonly IPasswordHasher _passwordHasher = passwordHasher;
        private readonly IJwtService _jwtService = jwtService;

        public async Task<UserResponse> ExecuteCreateAsync(CreateRequest request)
        {
            var user = await _userRespository.ExistByEmailUserAsync(request.Email);
            if (user) throw new UserAlreadyExistsException("El usuario ya existe");

            var passwordHash = _passwordHasher.HashPassword(request.Password);

            var response = new User
                (
                    Guid.NewGuid(),
                    request.Email,
                    passwordHash,
                    request.DisplayName,
                    "",
                    false,
                    request.Tel.ToString(),
                    Role.JOYENT,
                    Status.ACTIVE,
                    DateTime.Now,
                    DateTime.Now
                );

            await _userRespository.AddAsync(response);
            return new UserResponse
            {
                Message = "Usuario creado correctamente.",
            };
        }

        public async Task<LoginResponse> ExecuteLoginAsync(LoginRequest request)
        {
            var user = await _userRespository.GetByEmailAsync(request.Email)
                ?? throw new InvalidPasswordException("Credenciales inválidas");


            if (user.Status == Status.BLOCKED)
            {
                throw new UserBlockedException("El usuario esta bloqueado");
            }

            var validPassword = await _passwordHasher.VerifyPasswordAsync(request.Password, user.Password);
            if (!validPassword) throw new InvalidPasswordException("Credenciales inválidas");


            var accessToken = _jwtService.GenerateAccessToken(user);

            return new LoginResponse
            {
                UserId = user.Id,
                Name = user.DisplayName ?? string.Empty,
                Email = user.Email,
                Role = user.Role.ToString(),
                AccessToken = accessToken
            };
        }

        public async Task<UserResponse> ExecuteLogoutAsync(Guid userId, Guid tokenId, DateTime expiresAt)
        {
            var revokedAt = DateTime.UtcNow;
            var revokedToken = new RevokedToken(
                tokenId,
                userId,
                revokedAt,
                expiresAt
            );

            await _revokedTokenRepository.AddAsync(revokedToken);

            return new UserResponse
            {
                Message = "Sesión cerrada correctamente."
            };
        }
    }
}
