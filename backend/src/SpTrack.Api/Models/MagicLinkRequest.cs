using System.ComponentModel.DataAnnotations;

namespace SpTrack.Api.Models;

public class MagicLinkRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string TenantSlug { get; set; } = string.Empty;
}