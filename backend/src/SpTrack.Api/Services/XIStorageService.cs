namespace SpTrack.Api.Services;

public interface XIStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    Task<string> GetDownloadUrlAsync(string key, TimeSpan expiration);
    Task DeleteFileAsync(string key);
}