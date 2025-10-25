namespace SpTrack.Domain.Entities;

public class SlaPolicy
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AppliesToJson { get; set; } = "{}";
    public int FirstResponseMins { get; set; }
    public int ResolveMins { get; set; }
    public bool PauseOnWaitingCustomer { get; set; } = true;
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual ICollection<SlaTarget> SlaTargets { get; set; } = new List<SlaTarget>();
}