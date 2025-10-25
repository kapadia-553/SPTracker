namespace SpTrack.Domain.Entities;

public class Comment
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid TicketId { get; set; }
    public Guid AuthorId { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual User Author { get; set; } = null!;
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}