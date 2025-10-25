namespace SpTrack.Domain.Entities;

public class UserRole
{
    public Guid UserId { get; set; }
    public Guid? TenantId { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Tenant? Tenant { get; set; }
}