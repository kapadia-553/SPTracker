using Microsoft.EntityFrameworkCore;
using SpTrack.Infrastructure.Data;
using SpTrack.Domain.Enums;

namespace SpTrack.Worker.Jobs;

public class SlaJobService : ISlaJobService
{
    private readonly SpTrackDbContext _context;
    private readonly ILogger<SlaJobService> _logger;

    public SlaJobService(SpTrackDbContext context, ILogger<SlaJobService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task CheckSlaBreachesAsync()
    {
        var now = DateTime.UtcNow;

        var breachedTargets = await _context.SlaTargets
            .Include(st => st.Ticket)
                .ThenInclude(t => t.Assignee)
            .Include(st => st.SlaPolicy)
            .Where(st => 
                (st.FirstResponseDueAt.HasValue && st.FirstResponseDueAt.Value < now && !st.FirstResponseMet) ||
                (st.ResolveDueAt.HasValue && st.ResolveDueAt.Value < now && !st.ResolveMet))
            .ToListAsync();

        foreach (var target in breachedTargets)
        {
            _logger.LogWarning("SLA breach detected for ticket {TicketKey}", target.Ticket.Key);
            
            // Log the breach and send notifications
            // Implementation would include email notifications to assignee and team lead
        }
    }

    public async Task SendSlaWarningsAsync()
    {
        var warningTime = DateTime.UtcNow.AddHours(1);

        var warningTargets = await _context.SlaTargets
            .Include(st => st.Ticket)
                .ThenInclude(t => t.Assignee)
            .Include(st => st.SlaPolicy)
            .Where(st => 
                (st.FirstResponseDueAt.HasValue && st.FirstResponseDueAt.Value <= warningTime && !st.FirstResponseMet) ||
                (st.ResolveDueAt.HasValue && st.ResolveDueAt.Value <= warningTime && !st.ResolveMet))
            .ToListAsync();

        foreach (var target in warningTargets)
        {
            _logger.LogInformation("SLA warning for ticket {TicketKey}", target.Ticket.Key);
            
            // Send warning notifications
            // Implementation would include email notifications
        }
    }

    public async Task UpdateSlaTargetsAsync(Guid ticketId)
    {
        var ticket = await _context.Tickets
            .Include(t => t.SlaTarget)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null) return;

        // Update SLA calculations based on status changes
        if (ticket.Status == TicketStatus.WaitingCustomer && ticket.SlaTarget != null)
        {
            ticket.SlaTarget.PausedAt = DateTime.UtcNow;
        }
        else if (ticket.SlaTarget?.PausedAt.HasValue == true)
        {
            ticket.SlaTarget.PausedAt = null;
        }

        await _context.SaveChangesAsync();
    }
}