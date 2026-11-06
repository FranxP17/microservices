using Auth.Domain.Exceptions;
using System.Net;
using System.Text.Json;

namespace Auth.Api.Middleware
{
    public class ExceptionMiddleware(RequestDelegate next)
    {
        private readonly RequestDelegate _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(
            HttpContext context,
            Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = exception switch
            {
                UserNotFoundException => (int)HttpStatusCode.NotFound,
                InvalidParameterException => (int)HttpStatusCode.BadRequest,
                UserBlockedException => (int)HttpStatusCode.Forbidden,
                UserAlreadyExistsException => (int)HttpStatusCode.Conflict,
                InvalidPasswordException => (int)HttpStatusCode.Unauthorized,
                _ => (int)HttpStatusCode.InternalServerError
            };

            context.Response.StatusCode = statusCode;

            var response = new
            {
                status = statusCode,
                message = exception.Message
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(response)
            );
        }
    }
}