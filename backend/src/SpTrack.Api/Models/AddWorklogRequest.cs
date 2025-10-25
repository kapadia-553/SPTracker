using System.ComponentModel.DataAnnotations;

namespace SpTrack.Api.Models;

public class AddWorklogRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Minutes must be greater than 0")]
    public int Minutes { get; set; }
    
    [Required]
    public string ActivityType { get; set; } = string.Empty;
    
    public bool Billable { get; set; } = false;
    
    [Required]
    public string Notes { get; set; } = string.Empty;
}