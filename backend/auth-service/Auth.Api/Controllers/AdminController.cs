using Auth.Application.Dtos;
using Auth.Application.Ports.In;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Auth.Domain.Enums;
using Auth.Domain.Ports.Out;
using System.IdentityModel.Tokens.Jwt;

namespace Auth.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin")]
    [Authorize(Roles = "ADMIN")]
    public class AdminController(IAdminUseCase adminUseCase, IUserRespository userRepository) : ControllerBase
    {
        private readonly IAdminUseCase _adminUseCase = adminUseCase;

        [HttpPut("users/{id:guid}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] AdminUpdateUserRequest request)
        {
            if (!Guid.TryParse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var actorId))
                return Unauthorized();

            if (!await IsActiveAdmin(actorId))
                return Forbid();

            return Ok(await _adminUseCase.ExecuteUpdateUserAsync(id, request));
        }

        [HttpGet("counts/users")]
        [Authorize]
        public async Task<IActionResult> TotalUsers()
        {
            var total = await _adminUseCase.ExecuteGetTotalUser();
            return Ok(new
            {
                TotalUsers = total
            });
        }

        [HttpPost("users")]
        [Authorize]
        public async Task<IActionResult> CreateUser([FromBody] AdminUpdateUserRequest request)
        {
            if (!Guid.TryParse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var actorId))
                return Unauthorized();
            if (!await IsActiveAdmin(actorId))
                return Forbid();

            var created = await _adminUseCase.ExecuteCreateUserAsync(request);
            return StatusCode(StatusCodes.Status201Created, created);
        }

        [HttpDelete("users/{id:guid}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            if (!Guid.TryParse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var actorId))
                return Unauthorized();
            if (!await IsActiveAdmin(actorId))
                return Forbid();
            if (actorId == id)
                return BadRequest(new { message = "No puedes eliminar tu propia cuenta desde el panel." });

            await _adminUseCase.ExecuteDeleteUserAsync(id);
            return NoContent();
        }

        [HttpPatch("users/{id:guid}/rol")]
        [Authorize]
        public async Task<IActionResult> ChangeRol(Guid id, [FromBody] ChangeRolRequest request)
        {
            if (!Guid.TryParse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var actorId))
                return Unauthorized();
            if (!await IsActiveAdmin(actorId))
                return Forbid();
            return Ok(await _adminUseCase.ExecuteChangeRolAsync(id, request));
        }

        [HttpPatch("users/{id:guid}/status")]
        [Authorize]
        public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeStatusRequest request)
        {
            if (!Guid.TryParse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var actorId))
                return Unauthorized();
            if (!await IsActiveAdmin(actorId))
                return Forbid();
            return Ok(await _adminUseCase.ExecuteChangeStatusAsync(id, request));
        }

        private async Task<bool> IsActiveAdmin(Guid actorId)
        {
            var actor = await userRepository.GetByIdSync(actorId);
            return actor is not null && actor.Role == Role.ADMIN && actor.Status == Status.ACTIVE;
        }
    }
}
