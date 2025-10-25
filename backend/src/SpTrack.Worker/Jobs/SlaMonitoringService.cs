using Hangfire;
using SpTrack.Worker.Jobs;

namespace SpTrack.Worker.Jobs;

public class SlaMonitoringService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SlaMonitoringService> _logger;

    public SlaMonitoringService(IServiceProvider serviceProvider, ILogger<SlaMonitoringService> logger)
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
                // Schedule SLA monitoring jobs
                BackgroundJob.Enqueue<ISlaJobService>(x => x.CheckSlaBreachesAsync());
                BackgroundJob.Enqueue<ISlaJobService>(x => x.SendSlaWarningsAsync());

                _logger.LogInformation("SLA monitoring jobs scheduled at {Time}", DateTimeOffset.Now);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling SLA monitoring jobs");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}