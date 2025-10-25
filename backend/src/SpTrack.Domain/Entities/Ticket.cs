using SpTrack.Domain.Enums;

namespace SpTrack.Domain.Entities;

public class Ticket
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ProjectId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Priority Priority { get; set; } = Priority.P3;
    public TicketStatus Status { get; set; } = TicketStatus.New;
    public Severity Severity { get; set; } = Severity.Medium;
    public Guid? CategoryId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid ReporterId { get; set; }
    public Guid? AssigneeId { get; set; }
    public TicketSource Source { get; set; } = TicketSource.Web;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual Project Project { get; set; } = null!;
    public virtual Category? Category { get; set; }
    public virtual Product? Product { get; set; }
    public virtual User Reporter { get; set; } = null!;
    public virtual User? Assignee { get; set; }
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public virtual ICollection<Worklog> Worklogs { get; set; } = new List<Worklog>();
    public virtual ICollection<TicketCustomValue> CustomValues { get; set; } = new List<TicketCustomValue>();
    public virtual SlaTarget? SlaTarget { get; set; }
}