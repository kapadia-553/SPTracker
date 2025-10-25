using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;

namespace SpTrack.Infrastructure.Data;

public class SpTrackDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>, ISpTrackDbContext
{
    public SpTrackDbContext(DbContextOptions<SpTrackDbContext> options) : base(options)
    {
    }

    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Worklog> Worklogs => Set<Worklog>();
    public DbSet<SlaPolicy> SlaPolicies => Set<SlaPolicy>();
    public DbSet<SlaTarget> SlaTargets => Set<SlaTarget>();
    public DbSet<TicketCustomField> TicketCustomFields => Set<TicketCustomField>();
    public DbSet<TicketCustomValue> TicketCustomValues => Set<TicketCustomValue>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<MagicLinkToken> MagicLinkTokens => Set<MagicLinkToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);


        // Configure UserRole
        builder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.Role });
            entity.HasOne(e => e.User).WithMany(e => e.UserRoles).HasForeignKey(e => e.UserId);
        });

        // Configure Project
        builder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
        });

        // Configure Ticket
        builder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.AssigneeId);
            entity.HasOne(e => e.Project).WithMany(e => e.Tickets).HasForeignKey(e => e.ProjectId);
            entity.HasOne(e => e.Reporter).WithMany(e => e.ReportedTickets).HasForeignKey(e => e.ReporterId);
            entity.HasOne(e => e.Assignee).WithMany(e => e.AssignedTickets).HasForeignKey(e => e.AssigneeId);
        });

        // Configure TicketCustomValue composite key
        builder.Entity<TicketCustomValue>(entity =>
        {
            entity.HasKey(e => new { e.TicketId, e.FieldId });
        });

        // Add other entity configurations...
    }
}