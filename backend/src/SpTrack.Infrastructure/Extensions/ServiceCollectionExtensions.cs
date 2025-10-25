using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Amazon.S3;
using SpTrack.Infrastructure.Data;
using SpTrack.Infrastructure.Services;
using SpTrack.Application.Interfaces; // Import interfaces from Application layer
using SpTrack.Domain.Interfaces; // Update the using statement

namespace SpTrack.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Add Entity Framework
        services.AddDbContext<SpTrackDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<ISpTrackDbContext>(provider => provider.GetService<SpTrackDbContext>()!);

        // Add Redis Cache
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = configuration["Redis:ConnectionString"];
        });

        // Add S3 client
        services.AddSingleton<IAmazonS3>(provider =>
        {
            var config = new AmazonS3Config
            {
                ServiceURL = configuration["Storage:S3:Endpoint"],
                ForcePathStyle = true
            };

            return new AmazonS3Client(
                configuration["Storage:S3:Key"],
                configuration["Storage:S3:Secret"],
                config);
        });

        // Add custom services (Interface in Application, Implementation in Infrastructure)
        services.AddScoped<ISlaService, SlaService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IFileUploadService, FileUploadService>();
        services.AddScoped<IStorageService, S3StorageService>(); // Interface from Application, Implementation from Infrastructure

        return services;
    }
}