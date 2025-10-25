using System.ComponentModel.DataAnnotations;

namespace SpTrack.Api.Models;

public class InternalMagicLinkRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}