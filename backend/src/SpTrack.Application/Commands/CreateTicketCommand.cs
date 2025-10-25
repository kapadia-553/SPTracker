using MediatR;
using SpTrack.Application.DTOs;
using SpTrack.Domain.Enums;

namespace SpTrack.Application.Commands;

public record CreateTicketCommand(
    string Title,
    string Description,
    Priority Priority,
    Severity Severity,
    Guid ProjectId,
    Guid? TenantId,
    Guid? CategoryId,
    Guid? ProductId,
    Guid? AssigneeId,
    Dictionary<string, string> CustomFields
) : IRequest<TicketDto>;