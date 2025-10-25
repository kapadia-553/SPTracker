using SpTrack.Domain.Entities;

namespace SpTrack.Api.Services;

public interface IMagicLinkService
{
    Task SendMagicLinkAsync(string email, string? tenantSlug = null);
    Task SendInternalMagicLinkAsync(string email);
    Task<User?> ConsumeMagicLinkAsync(string token);
}