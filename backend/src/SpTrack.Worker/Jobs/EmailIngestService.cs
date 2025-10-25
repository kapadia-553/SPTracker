using SpTrack.Worker.Jobs;

namespace SpTrack.Worker.Jobs;

public class EmailIngestService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EmailIngestService> _logger;

    public EmailIngestService(IServiceProvider serviceProvider, ILogger<EmailIngestService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var emailJobService = scope.ServiceProvider.GetRequiredService<IEmailJobService>();
                
                await emailJobService.ProcessInboundEmailsAsync();
                
                _logger.LogDebug("Email processing completed at {Time}", DateTimeOffset.Now);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing inbound emails");
            }

            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
        }
    }
}