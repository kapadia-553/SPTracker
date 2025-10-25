namespace SpTrack.Application.DTOs;

public class CommentDto
{
    public Guid Id { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<AttachmentDto> Attachments { get; set; } = new();
}