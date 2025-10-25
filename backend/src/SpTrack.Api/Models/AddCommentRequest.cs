using System.ComponentModel.DataAnnotations;

namespace SpTrack.Api.Models;

public class AddCommentRequest
{
    [Required]
    public string Body { get; set; } = string.Empty;
    
    public bool IsInternal { get; set; } = false;
}