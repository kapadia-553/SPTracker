namespace SpTrack.Domain.Interfaces;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    Task<string> GetDownloadUrlAsync(string key, TimeSpan expiration);
    Task DeleteFileAsync(string key);
}