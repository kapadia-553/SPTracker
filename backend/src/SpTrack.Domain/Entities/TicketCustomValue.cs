namespace SpTrack.Domain.Entities;

public class TicketCustomValue
{
    public Guid TicketId { get; set; }
    public Guid FieldId { get; set; }
    public string Value { get; set; } = string.Empty;

    // Navigation properties
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual TicketCustomField Field { get; set; } = null!;
}