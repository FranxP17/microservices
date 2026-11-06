using Auth.Application.Dtos;

namespace Auth.Application.Ports.In
{
    public interface IAdminUseCase
    {
        Task<UserResponse> ExecuteChangeRolAsync(Guid userId, ChangeRolRequest request);
        Task<UserResponse> ExecuteChangeStatusAsync(Guid userId, ChangeStatusRequest request);
        Task<UserAllResponse> ExecuteUpdateUserAsync(Guid userId, AdminUpdateUserRequest request);
        Task<UserAllResponse> ExecuteCreateUserAsync(AdminUpdateUserRequest request);
        Task ExecuteDeleteUserAsync(Guid userId);
    }
}
