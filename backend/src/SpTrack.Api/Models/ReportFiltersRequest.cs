namespace SpTrack.Api.Models;

public class ReportFiltersRequest
{
    public string? Status { get; set; }
    public string? AssignedTo { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Priority { get; set; }
    public string? Tenant { get; set; }
    public string? Project { get; set; }
    public string? Category { get; set; }
    public string? Format { get; set; }
}