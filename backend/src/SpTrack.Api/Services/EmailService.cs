using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Org.BouncyCastle.Tls;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;

namespace SpTrack.Api.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        try
        {
            // Try multiple configuration approaches
            var smtpSection = _configuration.GetSection("SMTP");
            var host = smtpSection["HOST"] ??
                       _configuration["SMTP:HOST"] ??
                       _configuration["SMTP__HOST"] ??
                       _configuration["SMTP-HOST"];

            var port = smtpSection["PORT"] ??
                       _configuration["SMTP:PORT"] ??
                       _configuration["SMTP__PORT"] ??
                       _configuration["SMTP-PORT"] ?? "587";

            var user = smtpSection["USER"] ??
                       _configuration["SMTP:USER"] ??
                       _configuration["SMTP__USER"] ??
                       _configuration["SMTP-USER"];

            var pass = smtpSection["PASS"] ??
                       _configuration["SMTP:PASS"] ??
                       _configuration["SMTP__PASS"] ??
                       _configuration["SMTP-PASS"];

            var from = smtpSection["FROM"] ??
                       _configuration["SMTP:FROM"] ??
                       _configuration["SMTP__FROM"] ??
                       _configuration["SMTP-FROM"];

            _logger.LogInformation("Final values - Host: {Host}, User: {User}, Port: {Port}", host, user, port);

            if (string.IsNullOrEmpty(host))
            {
                // Hardcode as last resort
                host = "smtp.office365.com";
                user = "abdul@spsolutions.org";
                pass = "jmvttpypbqmrsjbs";
                from = "abdul@spsolutions.org";
                _logger.LogWarning("Using hardcoded SMTP values as fallback");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("SP Track", from));
            message.To.Add(new MailboxAddress("", to));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = body };

            using var client = new SmtpClient();
            client.ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true;

            await client.ConnectAsync(host, int.Parse(port), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(user, pass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }
}