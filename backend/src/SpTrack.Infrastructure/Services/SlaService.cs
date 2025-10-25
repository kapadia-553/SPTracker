using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;
using SpTrack.Domain.Enums;
using System.Text.Json;

namespace SpTrack.Infrastructure.Services;

public interface ISlaService
{
    Task CreateSlaTargetAsync(Ticket ticket);
    Task UpdateSlaTargetAsync(Ticket ticket);
    Task<bool> IsBusinessHour(DateTime dateTime);
    Task<DateTime> AddBusinessTime(DateTime startTime, int minutes);
}

public class SlaService : ISlaService
{
    private readonly ISpTrackDbContext _context;

    public SlaService(ISpTrackDbContext context)
    {
        _context = context;
    }

    public async Task CreateSlaTargetAsync(Ticket ticket)
    {
        var applicablePolicy = await FindApplicableSlaPolicy(ticket);
        if (applicablePolicy == null) return;

        var firstResponseDue = await AddBusinessTime(ticket.CreatedAt, applicablePolicy.FirstResponseMins);
        var resolveDue = await AddBusinessTime(ticket.CreatedAt, applicablePolicy.ResolveMins);

        // For P1 Critical, use 24x7 calendar
        if (ticket.Priority == Priority.P1)
        {
            firstResponseDue = ticket.CreatedAt.AddMinutes(applicablePolicy.FirstResponseMins);
            resolveDue = ticket.CreatedAt.AddMinutes(applicablePolicy.ResolveMins);
        }

        var slaTarget = new SlaTarget
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SlaPolicyId = applicablePolicy.Id,
            FirstResponseDueAt = firstResponseDue,
            ResolveDueAt = resolveDue,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SlaTargets.Add(slaTarget);
    }

    public async Task UpdateSlaTargetAsync(Ticket ticket)
    {
        var slaTarget = await _context.SlaTargets
            .Include(st => st.SlaPolicy)
            .FirstOrDefaultAsync(st => st.TicketId == ticket.Id);

        if (slaTarget == null) return;

        // Check if first response is met (first public comment by internal user)
        if (!slaTarget.FirstResponseMet)
        {
            var hasFirstResponse = await _context.Comments
                .Include(c => c.Author)
                .AnyAsync(c => c.TicketId == ticket.Id && 
                             !c.IsInternal && 
                             c.Author.IsInternal);

            if (hasFirstResponse)
            {
                slaTarget.FirstResponseMet = true;
            }
        }

        // Check if resolve is met
        if (!slaTarget.ResolveMet && 
            (ticket.Status == TicketStatus.Resolved || ticket.Status == TicketStatus.Closed))
        {
            slaTarget.ResolveMet = true;
        }

        // Handle pausing/resuming for "Waiting on Customer"
        if (slaTarget.SlaPolicy.PauseOnWaitingCustomer)
        {
            if (ticket.Status == TicketStatus.WaitingCustomer && !slaTarget.PausedAt.HasValue)
            {
                slaTarget.PausedAt = DateTime.UtcNow;
            }
            else if (ticket.Status != TicketStatus.WaitingCustomer && slaTarget.PausedAt.HasValue)
            {
                // Resume SLA - extend deadlines by pause duration
                var pauseDuration = DateTime.UtcNow - slaTarget.PausedAt.Value;
                
                if (slaTarget.FirstResponseDueAt.HasValue)
                    slaTarget.FirstResponseDueAt = slaTarget.FirstResponseDueAt.Value.Add(pauseDuration);
                
                if (slaTarget.ResolveDueAt.HasValue)
                    slaTarget.ResolveDueAt = slaTarget.ResolveDueAt.Value.Add(pauseDuration);

                slaTarget.PausedAt = null;
            }
        }

        slaTarget.UpdatedAt = DateTime.UtcNow;
    }

    public async Task<bool> IsBusinessHour(DateTime dateTime)
    {
        // Simplified implementation - assume business hours are 9am-6pm Mon-Fri
        var dayOfWeek = dateTime.DayOfWeek;
        var hour = dateTime.Hour;

        if (dayOfWeek == DayOfWeek.Saturday || dayOfWeek == DayOfWeek.Sunday)
            return false;

        return hour >= 9 && hour < 18;
    }

    public async Task<DateTime> AddBusinessTime(DateTime startTime, int minutes)
    {
        // Simplified implementation - in production this would properly calculate business time
        // accounting for weekends, holidays, and business hours

        var businessDays = minutes / (9 * 60); // 9 hour business day
        var remainingMinutes = minutes % (9 * 60);

        var result = startTime.AddDays(businessDays);
        result = result.AddMinutes(remainingMinutes);

        return result;
    }

    private async Task<SlaPolicy?> FindApplicableSlaPolicy(Ticket ticket)
    {
        var policies = await _context.SlaPolicies
            .Where(p => p.Active)
            .ToListAsync();

        foreach (var policy in policies)
        {
            try
            {
                var appliesTo = JsonSerializer.Deserialize<Dictionary<string, string[]>>(policy.AppliesToJson);
                
                if (appliesTo.ContainsKey("Priority") && 
                    appliesTo["Priority"].Contains(ticket.Priority.ToString()))
                {
                    return policy;
                }
            }
            catch
            {
                continue;
            }
        }

        return policies.FirstOrDefault(); // Default policy
    }
}