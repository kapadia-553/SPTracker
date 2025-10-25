using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;
using System.Text.Json;

namespace SpTrack.Infrastructure.Services;

public interface IAuditService
{
    Task LogAsync(string objectType, string objectId, string action, object? oldValue, object? newValue);
}

public class AuditService : IAuditService
{
    private readonly ISpTrackDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AuditService(ISpTrackDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task LogAsync(string objectType, string objectId, string action, object? oldValue, object? newValue)
    {
        var diff = new
        {
            Old = oldValue,
            New = newValue,
            Timestamp = DateTime.UtcNow
        };

        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            ActorId = _currentUser.UserId!.Value,
            ObjectType = objectType,
            ObjectId = objectId,
            Action = action,
            DiffJson = JsonSerializer.Serialize(diff),
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }
}