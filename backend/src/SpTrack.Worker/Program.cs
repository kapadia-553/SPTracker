using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SpTrack.Infrastructure.Data;
using SpTrack.Worker.Jobs;

var builder = Host.CreateApplicationBuilder(args);

// Serilog early
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

// Resolve connection string
var conn = builder.Configuration.GetConnectionString("DefaultConnection")
          ?? builder.Configuration["DB__CONNECTION_STRING"]
          ?? "Host=postgres;Port=5432;Database=sptrack;Username=postgres;Password=postgres";

// Add database context
builder.Services.AddDbContext<SpTrackDbContext>(opt =>
    opt.UseNpgsql(conn, x => x.MigrationsAssembly("SpTrack.Infrastructure")));

// Add email job service
builder.Services.AddScoped<IEmailJobService, EmailJobService>();

builder.Services.AddHangfire(cfg => cfg
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(opt => opt.UseNpgsqlConnection(conn)));

// Start a processing server (keeps the worker alive)
builder.Services.AddHangfireServer();

var host = builder.Build();

// small heartbeat so you see it’s alive
using (var scope = host.Services.CreateScope())
{
    var jobs = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    jobs.AddOrUpdate("worker-heartbeat", () => Console.WriteLine("worker alive...."), "*/1 * * * *");
}

try
{
    Log.Information("Worker starting with Hangfire storage: {storage}",
        JobStorage.Current?.GetType().FullName ?? "null");
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Worker terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
