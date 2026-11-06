using Auth.Application.Ports.In;
using Auth.Application.UseCases;
using Auth.Domain.Ports.Out;
using Auth.Infrastructure.Adapters.Out;
using Auth.Infrastructure.Persistence;
using Auth.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DotNetEnv;
using System.IdentityModel.Tokens.Jwt;
using Auth.Api.Middleware;

var envPath = Path.GetFullPath(
    Path.Combine(
        AppContext.BaseDirectory,
        "..", "..", "..", "..", "..", "..",
        ".env"
    ));
Env.Load(envPath);
var builder = WebApplication.CreateBuilder(args);


builder.Services.AddDbContext<UsersDbContext>(options =>
{
    var connectionString = BuilderConnectionString();
    options.UseMySql(
        connectionString, 
        new MySqlServerVersion(new Version(8,1,0)),
        MySqlOptions => 
        MySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(20),
            errorNumbersToAdd: null
            )
        );
});

builder.Services.AddControllers();

var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new InvalidOperationException("Falta configuración Jwt:Key");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? throw new InvalidOperationException("Falta configuración Jwt:Issuer");
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? throw new InvalidOperationException("Falta configuración Jwt:Audience");

var frontendOrigin = Environment.GetEnvironmentVariable("FRONTEND_ORIGIN") ?? throw new InvalidOperationException("Falta configuración FRONTEND_ORIGIN");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["access_token"];
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var jti = context.Principal?
                    .FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                var userIdValue = context.Principal?.FindFirst("sub")?.Value;

                if (string.IsNullOrWhiteSpace(jti) || !Guid.TryParse(userIdValue, out var userId))
                {
                    context.Fail("El token no contiene un identificador válido.");
                    return;
                }

                var repository = context.HttpContext.RequestServices
                    .GetRequiredService<IRevokedTokenRepository>();

                if (Guid.TryParse(jti, out var tokenId))
                {
                    try
                    {
                        var revokedToken = await repository.GetByIdAsync(tokenId);
                        if (revokedToken.ExpiresAt > DateTime.UtcNow)
                        {
                            context.Fail("El token ha sido revocado.");
                            return;
                        }
                    }
                    catch
                    {
                    }
                }

                var userRepository = context.HttpContext.RequestServices.GetRequiredService<IUserRespository>();
                if (await userRepository.GetByIdSync(userId) is null)
                {
                    context.Fail("La cuenta asociada al token ya no existe.");
                    return;
                }
            }
        };
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        options.Events.OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new { message = "No autorizado" });
            return context.Response.WriteAsync(result);
        };

        options.Events.OnForbidden = async context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                status = 403,
                message = "No tienes permisos para acceder a este recurso."
            });
        };
    });

builder.Services.AddCors(options => options.AddPolicy("VuePolicy", policy =>
    policy.WithOrigins()
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials()));

builder.Services.AddAuthorization();

// Injection Dependency
// Repositorios
builder.Services.AddScoped<IUserRespository, UserRepository>();
builder.Services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();

// Securidad 
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();

// Casos de usos
builder.Services.AddScoped<IAuthUseCase, AuthUseCase>();
builder.Services.AddScoped<IUsersUseCase, UsersUseCase>();
builder.Services.AddScoped<IAdminUseCase, AdminUseCase>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("VuePolicy", policy =>
    {
        policy.WithOrigins(frontendOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("VuePolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var db = services.GetRequiredService<UsersDbContext>();
        await db.Database.EnsureCreatedAsync();
        logger.LogInformation("Migraciones aplicadas a la base {Database}.", db.Database.GetDbConnection().Database);
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "No se pudieron aplicar las migraciones de Users.");
        throw;
    }
}
app.Run();


static string BuilderConnectionString()
{
    var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
    var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
    var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "users_db";
    var username = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
    var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "root";
    return $"Host={host};Port={port};Database={database};Username={username};Password={password};";
}