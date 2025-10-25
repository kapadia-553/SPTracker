namespace SpTrack.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Timezone { get; set; } = "Asia/Dubai";
    public string BusinessHoursJson { get; set; } = "{}";
    public string? LogoUrl { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public virtual ICollection<SlaPolicy> SlaPolicies { get; set; } = new List<SlaPolicy>();
}