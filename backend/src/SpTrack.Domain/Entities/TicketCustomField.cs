namespace SpTrack.Domain.Entities;

public class TicketCustomField
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string OptionsJson { get; set; } = "[]";
    public bool Required { get; set; } = false;
    public string Scope { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Tenant Tenant { get; set; } = null!;
    public virtual ICollection<TicketCustomValue> CustomValues { get; set; } = new List<TicketCustomValue>();
}