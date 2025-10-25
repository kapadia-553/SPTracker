using Microsoft.AspNetCore.Identity;

namespace SpTrack.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsInternal { get; set; } = false;
    public bool Active { get; set; } = true;
    public Guid? TenantId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<Ticket> ReportedTickets { get; set; } = new List<Ticket>();
    public virtual ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Worklog> Worklogs { get; set; } = new List<Worklog>();
}