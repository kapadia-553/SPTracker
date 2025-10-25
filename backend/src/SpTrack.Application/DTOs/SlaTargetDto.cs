namespace SpTrack.Application.DTOs;

public class SlaTargetDto
{
    public Guid Id { get; set; }
    public string PolicyName { get; set; } = string.Empty;
    public DateTime? FirstResponseDueAt { get; set; }
    public DateTime? ResolveDueAt { get; set; }
    public bool FirstResponseMet { get; set; }
    public bool ResolveMet { get; set; }
    public bool IsPaused { get; set; }
    public TimeSpan? FirstResponseTimeRemaining { get; set; }
    public TimeSpan? ResolveTimeRemaining { get; set; }
    public bool IsFirstResponseBreached { get; set; }
    public bool IsResolveBreached { get; set; }
}