namespace SpTrack.Domain.Entities;

public class SlaTarget
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid TicketId { get; set; }
    public Guid SlaPolicyId { get; set; }
    public DateTime? FirstResponseDueAt { get; set; }
    public DateTime? ResolveDueAt { get; set; }
    public bool FirstResponseMet { get; set; } = false;
    public bool ResolveMet { get; set; } = false;
    public DateTime? PausedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual SlaPolicy SlaPolicy { get; set; } = null!;
}