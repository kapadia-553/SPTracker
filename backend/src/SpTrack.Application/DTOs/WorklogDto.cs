namespace SpTrack.Application.DTOs;

public class WorklogDto
{
    public Guid Id { get; set; }
    public int Minutes { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public bool Billable { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}