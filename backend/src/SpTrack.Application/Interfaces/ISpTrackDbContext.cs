using Microsoft.EntityFrameworkCore;
using SpTrack.Domain.Entities;

namespace SpTrack.Application.Interfaces;

public interface ISpTrackDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<Tenant> Tenants { get; }
    DbSet<Project> Projects { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<Ticket> Tickets { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Attachment> Attachments { get; }
    DbSet<Worklog> Worklogs { get; }
    DbSet<SlaPolicy> SlaPolicies { get; }
    DbSet<SlaTarget> SlaTargets { get; }
    DbSet<TicketCustomField> TicketCustomFields { get; }
    DbSet<TicketCustomValue> TicketCustomValues { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<MagicLinkToken> MagicLinkTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}