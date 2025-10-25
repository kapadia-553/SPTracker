using MediatR;
using SpTrack.Application.DTOs;
using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;
using SpTrack.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace SpTrack.Application.Commands;

public class CreateTicketHandler : IRequestHandler<CreateTicketCommand, TicketDto>
{
    private readonly ISpTrackDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateTicketHandler(ISpTrackDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<TicketDto> Handle(CreateTicketCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects.FindAsync(request.ProjectId);
        if (project == null)
            throw new UnauthorizedAccessException("Project not found");

        // Use provided TenantId or get from user role assignment
        Guid? tenantId = request.TenantId ?? _currentUser.TenantId;
        if (tenantId == null && _currentUser.UserId.HasValue)
        {
            var userRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == _currentUser.UserId.Value, cancellationToken);
            tenantId = userRole?.TenantId;
        }

        if (tenantId == null)
            throw new UnauthorizedAccessException("Unable to determine tenant for ticket creation. Please specify a tenant.");

        if (!_currentUser.UserId.HasValue)
            throw new UnauthorizedAccessException("User not authenticated or user ID not available.");

        var ticketNumber = await GenerateTicketNumber(project.Key, tenantId.Value);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId.Value,
            ProjectId = request.ProjectId,
            Key = ticketNumber,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Severity = request.Severity,
            CategoryId = request.CategoryId,
            ProductId = request.ProductId,
            AssigneeId = request.AssigneeId,
            ReporterId = _currentUser.UserId.Value,
            Status = TicketStatus.New,
            Source = TicketSource.Web,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync(cancellationToken);

        // Fetch the created ticket with all related data
        var createdTicket = await _context.Tickets
            .Include(t => t.Reporter)
            .Include(t => t.Assignee)
            .Include(t => t.Category)
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == ticket.Id, cancellationToken);

        if (createdTicket == null)
            throw new InvalidOperationException("Failed to retrieve created ticket");

        return new TicketDto
        {
            Id = createdTicket.Id,
            Key = createdTicket.Key,
            Title = createdTicket.Title,
            Description = createdTicket.Description,
            Priority = createdTicket.Priority,
            Status = createdTicket.Status,
            Severity = createdTicket.Severity,
            CategoryName = createdTicket.Category?.Name,
            ProductName = createdTicket.Product?.Name,
            ReporterName = createdTicket.Reporter.Name,
            ReporterEmail = createdTicket.Reporter.Email!,
            AssigneeName = createdTicket.Assignee?.Name,
            AssigneeEmail = createdTicket.Assignee?.Email,
            Source = createdTicket.Source,
            CreatedAt = createdTicket.CreatedAt,
            UpdatedAt = createdTicket.UpdatedAt,
            ClosedAt = createdTicket.ClosedAt,
            Comments = new List<CommentDto>(),
            Attachments = new List<AttachmentDto>()
        };
    }

    private async Task<string> GenerateTicketNumber(string projectKey, Guid tenantId)
    {
        var lastTicket = await _context.Tickets
            .Where(t => t.TenantId == tenantId && t.Key.StartsWith(projectKey))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        var nextNumber = 1;
        if (lastTicket != null && int.TryParse(lastTicket.Key.Split('-').Last(), out var lastNumber))
        {
            nextNumber = lastNumber + 1;
        }

        return $"{projectKey}-{nextNumber:D4}";
    }
}