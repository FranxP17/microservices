using Auth.Application.Dtos;

namespace Auth.Application.Ports.In
{
    public interface IAuthUseCase
    {
        Task<UserResponse> ExecuteCreateAsync(CreateRequest request);
        Task<LoginResponse> ExecuteLoginAsync(LoginRequest request);
        Task<UserResponse> ExecuteLogoutAsync(Guid userId, Guid tokenId, DateTime expiresAt);
    }
}
