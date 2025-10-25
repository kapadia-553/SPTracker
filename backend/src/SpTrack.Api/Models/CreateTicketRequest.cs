using System.ComponentModel.DataAnnotations;
using SpTrack.Domain.Enums;
using System.Text.Json.Serialization;

namespace SpTrack.Api.Models;

public class CreateTicketRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Priority Priority { get; set; } = Priority.P3;
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Severity Severity { get; set; } = Severity.Medium;

    [Required]
    public Guid ProjectId { get; set; }

    public Guid? TenantId { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? AssigneeId { get; set; }
    public Dictionary<string, string>? CustomFields { get; set; }
}

public class UpdateTicketRequest
{
    public string? Status { get; set; }
    public Guid? AssigneeId { get; set; }
    public string? Priority { get; set; }
    public string? Severity { get; set; }

    // Flag to indicate if AssigneeId should be processed
    // When true, AssigneeId will be updated (can be null for unassignment)
    // When false or not provided, AssigneeId is ignored (preserves current assignment)
    public bool UpdateAssigneeId { get; set; } = false;
}