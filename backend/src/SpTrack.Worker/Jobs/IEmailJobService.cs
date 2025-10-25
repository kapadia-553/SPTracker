namespace SpTrack.Worker.Jobs;

public interface IEmailJobService
{
    Task ProcessInboundEmailsAsync();
    Task SendTicketNotificationAsync(Guid ticketId, string eventType);
    Task SendTestEmailAsync(string toEmail);
}