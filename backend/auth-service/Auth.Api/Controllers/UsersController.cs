using Auth.Application.Dtos;
using Auth.Application.Ports.In;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace Auth.Api.Controllers
{
    [ApiController]
    [Route("api/v1/users")]
    public class UsersController(IUsersUseCase usersUseCase) : ControllerBase
    {
        private readonly IUsersUseCase _usersUseCase = usersUseCase;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            try
            {
                var response = await _usersUseCase.ExecuteGetByUsersAsync(page, limit);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetUserId();
            var response = await _usersUseCase.ExecuteGetUserByIdAsync(userId);
            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            try
            {
                var response = await _usersUseCase.ExecuteGetUserByIdAsync(id);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("me/credentials")]
        [Authorize]
        public async Task<IActionResult> UpdateMyCredentials([FromBody] UpdateCredentialsRequest request)
        {
            try
            {
                var userId = GetUserId();
                var response = await _usersUseCase.ExecuteUpdateCredentialsAsync(userId, request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> DeleteMyAccount()
        {
            try
            {
                var userId = GetUserId();
                var response = await _usersUseCase.ExecuteDeleteMyAccountAsync(userId);

                Response.Cookies.Delete("access_token", new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.Strict
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private Guid GetUserId()
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!Guid.TryParse(sub, out var userId))
                throw new Exception("Token inválido: no contiene userId válido.");

            return userId;
        }
    }
}
