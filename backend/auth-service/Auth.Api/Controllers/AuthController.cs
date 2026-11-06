using Auth.Application.Dtos;
using Auth.Application.Ports.In;
using Auth.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace Auth.Api.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController(IAuthUseCase authUseCase) : ControllerBase
    {
        private readonly IAuthUseCase _authUseCase = authUseCase;

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateRequest request)
        {
            var response = await _authUseCase.ExecuteCreateAsync(request);
            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var loginData = await _authUseCase.ExecuteLoginAsync(request);
            var expiresMinutesRaw = Environment.GetEnvironmentVariable("JWT_EXPIRYMINUTES");
            var expiresMinutes = int.TryParse(expiresMinutesRaw, out var value) ? value : 60;

            var expiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes);

            Response.Cookies.Append("access_token", loginData.AccessToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires = expiresAt
            });

            return Ok(new
            {
                message = "Login exitoso",
                userId = loginData.UserId,
                name = loginData.Name,
                email = loginData.Email,
                role = loginData.Role
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userId = GetUserId();
                var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                var exp = User.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;

                if (!Guid.TryParse(jti, out var tokenId))
                    throw new Exception("Token inválido: jti no válido.");

                if (!long.TryParse(exp, out var expUnix))
                    throw new Exception("Token inválido: exp no válido.");

                var expiresAt = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;
                var response = await _authUseCase.ExecuteLogoutAsync(userId, tokenId, expiresAt);

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
