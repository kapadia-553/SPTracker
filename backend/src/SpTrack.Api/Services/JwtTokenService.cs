using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SpTrack.Domain.Entities;
using SpTrack.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SpTrack.Api.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly ISpTrackDbContext _context;
    private readonly ILogger<JwtTokenService> _logger;

    public JwtTokenService(IConfiguration configuration, ISpTrackDbContext context, ILogger<JwtTokenService> logger)
    {
        _configuration = configuration;
        _context = context;
        _logger = logger;
    }

    public async Task<string> GenerateTokenAsync(User user)
    {
        var jwtSettings = _configuration.GetSection("JWT");
        var keyValue = jwtSettings["Key"];

        _logger.LogWarning("🔑 JWT Key Debug - Length: {Length}, First 20 chars: {Preview}",
            keyValue?.Length ?? 0,
            keyValue != null && keyValue.Length >= 20 ? keyValue.Substring(0, 20) : keyValue ?? "NULL");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyValue!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new("sub", user.Id.ToString()),
            new("email", user.Email!),
            new("name", user.Name),
            new("is_internal", user.IsInternal.ToString().ToLower())
        };

        // Get user roles and tenant information
        var userRoles = await _context.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .ToListAsync();

        foreach (var userRole in userRoles)
        {
            claims.Add(new Claim("role", userRole.Role));

            // Add tenant information for customer users
            if (userRole.TenantId.HasValue)
            {
                claims.Add(new Claim("tenant_id", userRole.TenantId.Value.ToString()));
            }
        }

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        _logger.LogWarning("🎫 Generated JWT Token - Issuer: {Issuer}, Audience: {Audience}, Claims: {Claims}",
            jwtSettings["Issuer"],
            jwtSettings["Audience"],
            claims.Count);
        _logger.LogWarning("   Token Preview: {Token}", tokenString.Substring(0, Math.Min(100, tokenString.Length)));

        return tokenString;
    }
}