using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SpTrack.Application.Interfaces; // Import the interface from Application layer
using SpTrack.Domain.Interfaces; // Update the using statement

namespace SpTrack.Infrastructure.Services;

public class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly ILogger<S3StorageService> _logger;

    public S3StorageService(IConfiguration configuration, ILogger<S3StorageService> logger)
    {
        var config = new AmazonS3Config
        {
            ServiceURL = configuration["Storage:S3:Endpoint"],
            ForcePathStyle = true
        };

        _s3Client = new AmazonS3Client(
            configuration["Storage:S3:Key"],
            configuration["Storage:S3:Secret"],
            config);

        _bucketName = configuration["Storage:S3:Bucket"]!;
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var key = $"{Guid.NewGuid()}/{fileName}";

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = fileStream,
            ContentType = contentType
        };

        try
        {
            await _s3Client.PutObjectAsync(request);
            _logger.LogInformation("File uploaded successfully: {Key}", key);
            return key;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file: {FileName}", fileName);
            throw;
        }
    }

    public async Task<string> GetDownloadUrlAsync(string key, TimeSpan expiration)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Expires = DateTime.UtcNow.Add(expiration),
            Verb = HttpVerb.GET
        };

        // GetPreSignedURL is a synchronous method
        return _s3Client.GetPreSignedURL(request);
    }

    public async Task DeleteFileAsync(string key)
    {
        try
        {
            await _s3Client.DeleteObjectAsync(_bucketName, key);
            _logger.LogInformation("File deleted successfully: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file: {Key}", key);
            throw;
        }
    }
}