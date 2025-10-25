namespace SpTrack.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ActorId { get; set; }
    public string ObjectType { get; set; } = string.Empty;
    public string ObjectId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string DiffJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual User Actor { get; set; } = null!;
}