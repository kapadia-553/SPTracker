using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SpTrack.Infrastructure.Data;
using StackExchange.Redis;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly SpTrackDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<HealthController> _logger;

    public HealthController(SpTrackDbContext context, IConnectionMultiplexer redis, ILogger<HealthController> logger)
    {
        _context = context;
        _redis = redis;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var health = new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Version = "1.0.0",
            Checks = new
            {
                Database = await CheckDatabase(),
                Redis = await CheckRedis(),
                Storage = CheckStorage()
            }
        };

        return Ok(health);
    }

    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        try
        {
            var dbReady = await CheckDatabase();
            var redisReady = await CheckRedis();

            if (dbReady && redisReady)
            {
                return Ok(new { Status = "Ready" });
            }

            return StatusCode(503, new { Status = "Not Ready" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new { Status = "Error", Error = ex.Message });
        }
    }

    [HttpGet("live")]
    public IActionResult Live()
    {
        return Ok(new { Status = "Alive", Timestamp = DateTime.UtcNow });
    }

    private async Task<bool> CheckDatabase()
    {
        try
        {
            await _context.Database.CanConnectAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Database health check failed");
            return false;
        }
    }

    private async Task<bool> CheckRedis()
    {
        try
        {
            var db = _redis.GetDatabase();
            await db.PingAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis health check failed");
            return false;
        }
    }

    private bool CheckStorage()
    {
        try
        {
            // Add S3/MinIO health check here
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Storage health check failed");
            return false;
        }
    }
}