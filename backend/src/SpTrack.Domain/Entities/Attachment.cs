using SpTrack.Domain.Enums;

namespace SpTrack.Domain.Entities;

public class Attachment
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid TicketId { get; set; }
    public Guid? CommentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public Guid UploadedById { get; set; }
    public AVStatus AVStatus { get; set; } = AVStatus.Pending;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual Comment? Comment { get; set; }
    public virtual User UploadedBy { get; set; } = null!;
}