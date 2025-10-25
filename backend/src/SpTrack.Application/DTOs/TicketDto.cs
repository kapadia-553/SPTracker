using SpTrack.Domain.Enums;

namespace SpTrack.Application.DTOs;

public class TicketDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Priority Priority { get; set; }
    public TicketStatus Status { get; set; }
    public Severity Severity { get; set; }
    public string? CategoryName { get; set; }
    public string? ProductName { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string ReporterEmail { get; set; } = string.Empty;
    public string? AssigneeName { get; set; }
    public string? AssigneeEmail { get; set; }
    public Guid? AssigneeId { get; set; }
    public TicketSource Source { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public SlaTargetDto? SlaTarget { get; set; }
    public List<CommentDto> Comments { get; set; } = new();
    public List<AttachmentDto> Attachments { get; set; } = new();
    public List<WorklogDto> Worklogs { get; set; } = new();
}