using Auth.Application.Dtos;
using Auth.Domain.Entities;

namespace Auth.Application.Ports.In
{
    public interface IUsersUseCase
    {
        Task<UserResponse> ExecuteUpdateCredentialsAsync(Guid userId, UpdateCredentialsRequest request);
        Task<UserResponse> ExecuteDeleteMyAccountAsync(Guid userId);
        Task<UserDetailResponse> ExecuteGetUserByIdAsync(Guid userId);
        Task<UsersReponse> ExecuteGetByUsersAsync(int page, int limit);
    }
}
