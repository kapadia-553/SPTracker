using SpTrack.Domain.Entities;

namespace SpTrack.Api.Services;

public interface IJwtTokenService
{
    Task<string> GenerateTokenAsync(User user);
}