namespace SpTrack.Api.Models;

public class TicketFilterRequest
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? Severity { get; set; }
    public Guid? AssigneeId { get; set; }
    public Guid? ReporterId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? CategoryId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Q { get; set; }
    public string? FilterType { get; set; } // "all", "my", "unassigned", "overdue"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}