using SpTrack.Domain.Enums;

namespace SpTrack.Application.DTOs;

public class AttachmentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public AVStatus AVStatus { get; set; }
    public string UploadedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? DownloadUrl { get; set; }
}