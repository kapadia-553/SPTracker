namespace SpTrack.Worker.Jobs;

public interface ISlaJobService
{
    Task CheckSlaBreachesAsync();
    Task SendSlaWarningsAsync();
    Task UpdateSlaTargetsAsync(Guid ticketId);
}