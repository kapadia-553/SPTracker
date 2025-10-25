namespace SpTrack.Domain.Entities;

public class Worklog
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid TicketId { get; set; }
    public Guid UserId { get; set; }
    public int Minutes { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public bool Billable { get; set; } = true;
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}