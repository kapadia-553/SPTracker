using System.Security.Claims;
using SpTrack.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace SpTrack.Api.Services;

public class CurrentUserService : ICurrentUserService, SpTrack.Application.Interfaces.ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<CurrentUserService> _logger;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor, ILogger<CurrentUserService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public Guid? UserId => GetGuidClaim("sub") ?? GetGuidClaim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
    public Guid? TenantId => GetGuidClaim("tenant_id");
    public string? Email => _httpContextAccessor.HttpContext?.User?.FindFirstValue("email") ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress");
    public IEnumerable<string> Roles
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
            {
                _logger.LogWarning("CurrentUserService.Roles: HttpContext.User is NULL");
                return Enumerable.Empty<string>();
            }

            var allClaims = user.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
            _logger.LogWarning("CurrentUserService.Roles: All claims = [{Claims}]", string.Join(", ", allClaims));

            var roles = user.FindAll("role").Select(c => c.Value).ToList();
            _logger.LogWarning("CurrentUserService.Roles: Found {Count} roles with 'role' claim type", roles.Count);

            var longRoles = user.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/role").Select(c => c.Value).ToList();
            _logger.LogWarning("CurrentUserService.Roles: Found {Count} roles with long URI claim type", longRoles.Count);

            roles.AddRange(longRoles);
            _logger.LogWarning("CurrentUserService.Roles: Total roles = [{Roles}]", string.Join(", ", roles));

            return roles.Distinct();
        }
    }
    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
    public bool IsInternal => _httpContextAccessor.HttpContext?.User?.FindFirstValue("is_internal") == "true";

    private Guid? GetGuidClaim(string claimType)
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(claimType);
        return Guid.TryParse(claim, out var guid) ? guid : null;
    }
}