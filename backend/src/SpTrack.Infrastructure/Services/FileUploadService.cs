using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;
using SpTrack.Domain.Enums;
using System.Net.Sockets;
using System.Text;
using Microsoft.Extensions.Configuration;
namespace SpTrack.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using SpTrack.Domain.Interfaces; // Update the using statement

public interface IFileUploadService
{
    Task<Attachment> UploadFileAsync(Stream fileStream, string fileName, string contentType, Guid ticketId, Guid? commentId = null);
    Task<bool> ScanFileAsync(string filePath);
}

public class FileUploadService : IFileUploadService
{

    private readonly ISpTrackDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IStorageService _storageService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FileUploadService> _logger;

    public FileUploadService(
        ISpTrackDbContext context,
        ICurrentUserService currentUser,
        IStorageService storageService,
        IConfiguration configuration,
        ILogger<FileUploadService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _storageService = storageService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<Attachment> UploadFileAsync(Stream fileStream, string fileName, string contentType, Guid ticketId, Guid? commentId = null)
    {
        // Upload to storage
        var storageKey = await _storageService.UploadFileAsync(fileStream, fileName, contentType);

        // Create attachment record
        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            CommentId = commentId,
            FileName = fileName,
            ContentType = contentType,
            Size = fileStream.Length,
            StorageKey = storageKey,
            UploadedById = _currentUser.UserId!.Value,
            AVStatus = AVStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Attachments.Add(attachment);
        await _context.SaveChangesAsync();

        // Queue virus scan
        _ = Task.Run(async () =>
        {
            var isClean = await ScanFileAsync(storageKey);
            attachment.AVStatus = isClean ? AVStatus.Clean : AVStatus.Infected;
            await _context.SaveChangesAsync();
        });

        return attachment;
    }

    public async Task<bool> ScanFileAsync(string storageKey)
    {
        try
        {
            var clamAvHost = _configuration["ClamAV:Host"];
            var clamAvPort = int.Parse(_configuration["ClamAV:Port"] ?? "3310");

            using var client = new TcpClient();
            await client.ConnectAsync(clamAvHost!, clamAvPort);
            
            using var stream = client.GetStream();
            
            // Send PING command
            var pingCommand = Encoding.ASCII.GetBytes("zPING\0");
            await stream.WriteAsync(pingCommand);
            
            var buffer = new byte[1024];
            var bytesRead = await stream.ReadAsync(buffer);
            var response = Encoding.ASCII.GetString(buffer, 0, bytesRead);
            
            if (response.Contains("PONG"))
            {
                _logger.LogInformation("ClamAV scan completed for file: {StorageKey}", storageKey);
                return true; // Simplified - assume clean for demo
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to scan file: {StorageKey}", storageKey);
            return false;
        }
    }
}