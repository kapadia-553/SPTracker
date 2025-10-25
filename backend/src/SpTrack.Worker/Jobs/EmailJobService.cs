using MailKit.Net.Imap;
using MailKit;
using MimeKit;
using Microsoft.EntityFrameworkCore;
using SpTrack.Infrastructure.Data;
using SpTrack.Domain.Entities;
using SpTrack.Domain.Enums;
using System.Text.RegularExpressions;

namespace SpTrack.Worker.Jobs;

public class EmailJobService : IEmailJobService
{
    private readonly SpTrackDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailJobService> _logger;

    public EmailJobService(SpTrackDbContext context, IConfiguration configuration, ILogger<EmailJobService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task ProcessInboundEmailsAsync()
    {
        try
        {
            using var client = new ImapClient();
            await client.ConnectAsync(_configuration["IMAP:Host"], 
                int.Parse(_configuration["IMAP:Port"] ?? "993"), true);
            
            await client.AuthenticateAsync(_configuration["IMAP:User"], _configuration["IMAP:Pass"]);

            await client.Inbox.OpenAsync(FolderAccess.ReadWrite);

            var messages = await client.Inbox.FetchAsync(0, -1, MessageSummaryItems.Full);

            foreach (var summary in messages.Where(m => !m.Flags.HasValue || !m.Flags.Value.HasFlag(MessageFlags.Seen)))
            {
                var message = await client.Inbox.GetMessageAsync(summary.UniqueId);
                await ProcessEmailMessage(message);
                
                await client.Inbox.AddFlagsAsync(summary.UniqueId, MessageFlags.Seen, true);
            }

            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing inbound emails");
        }
    }

    private async Task ProcessEmailMessage(MimeMessage message)
    {
        var ticketKeyPattern = @"\[([A-Z]+-\d+)\]";
        var match = Regex.Match(message.Subject, ticketKeyPattern);

        if (match.Success)
        {
            var ticketKey = match.Groups[1].Value;
            await AddCommentToExistingTicket(ticketKey, message);
        }
        else
        {
            await CreateNewTicketFromEmail(message);
        }
    }

    private async Task AddCommentToExistingTicket(string ticketKey, MimeMessage message)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Key == ticketKey);

        if (ticket == null)
        {
            _logger.LogWarning("Ticket not found for key: {TicketKey}", ticketKey);
            return;
        }

        var senderEmail = message.From.Mailboxes.First().Address;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == senderEmail);

        if (user == null)
        {
            _logger.LogWarning("User not found for email: {Email}", senderEmail);
            return;
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            TenantId = ticket.TenantId,
            TicketId = ticket.Id,
            AuthorId = user.Id,
            Body = message.TextBody ?? message.HtmlBody ?? "No content",
            IsInternal = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Comment added to ticket {TicketKey} from {Email}", ticketKey, senderEmail);
    }

    private async Task CreateNewTicketFromEmail(MimeMessage message)
    {
        var senderEmail = message.From.Mailboxes.First().Address;
        var userRole = await _context.UserRoles
            .Include(ur => ur.User)
            .Include(ur => ur.Tenant)
            .FirstOrDefaultAsync(ur => ur.User.Email == senderEmail && !ur.User.IsInternal);

        if (userRole?.Tenant == null)
        {
            _logger.LogWarning("No tenant found for customer email: {Email}", senderEmail);
            return;
        }

        var defaultProject = await _context.Projects.FirstOrDefaultAsync(p => p.Active);
        if (defaultProject == null)
        {
            _logger.LogWarning("No active project found in the system");
            return;
        }

        var ticketNumber = await GenerateTicketNumber(defaultProject.Key, userRole.TenantId!.Value);
        
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TenantId = userRole.TenantId.Value,
            ProjectId = defaultProject.Id,
            Key = ticketNumber,
            Title = message.Subject,
            Description = message.TextBody ?? message.HtmlBody ?? "No content",
            Priority = Priority.P3,
            Status = TicketStatus.New,
            Severity = Severity.Medium,
            ReporterId = userRole.UserId,
            Source = TicketSource.Email,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        _logger.LogInformation("New ticket created from email: {TicketKey} from {Email}", ticketNumber, senderEmail);
    }

    private async Task<string> GenerateTicketNumber(string projectKey, Guid tenantId)
    {
        var lastTicket = await _context.Tickets
            .Where(t => t.TenantId == tenantId && t.Key.StartsWith(projectKey))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        var nextNumber = 1;
        if (lastTicket != null && int.TryParse(lastTicket.Key.Split('-').Last(), out var lastNumber))
        {
            nextNumber = lastNumber + 1;
        }

        return $"{projectKey}-{nextNumber:D4}";
    }

    public async Task SendTicketNotificationAsync(Guid ticketId, string eventType)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Reporter)
            .Include(t => t.Assignee)
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
        {
            _logger.LogWarning("Ticket not found for notification: {TicketId}", ticketId);
            return;
        }

        switch (eventType.ToLower())
        {
            case "assigned":
                if (ticket.Assignee != null)
                {
                    await SendTicketAssignmentNotificationAsync(ticket);
                }
                break;
            case "created":
                await SendTicketCreatedNotificationAsync(ticket);
                break;
            case "updated":
                await SendTicketUpdatedNotificationAsync(ticket);
                break;
            default:
                _logger.LogWarning("Unknown event type for notification: {EventType}", eventType);
                break;
        }

        _logger.LogInformation("Notification sent for ticket {TicketKey}, event: {EventType}", ticket.Key, eventType);
    }

    private async Task SendTicketAssignmentNotificationAsync(Ticket ticket)
    {
        if (ticket.Assignee?.Email == null)
        {
            _logger.LogWarning("Assignee email not found for ticket {TicketKey}", ticket.Key);
            return;
        }

        var subject = $"[{ticket.Key}] Ticket Assigned to You - {ticket.Title}";
        var baseUrl = _configuration["APP__BASE_URL"] ?? "http://localhost:5000";

        var emailBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 30px; }}
        .ticket-info {{ background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }}
        .priority-high {{ border-left-color: #dc3545; }}
        .priority-medium {{ border-left-color: #ffc107; }}
        .priority-low {{ border-left-color: #28a745; }}
        .button {{ display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ background-color: #f8f9fa; padding: 15px; text-align: center; color: #6c757d; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2>Ticket Assigned to You</h2>
        </div>
        <div class=""content"">
            <p>Hello {ticket.Assignee.Name},</p>
            <p>A support ticket has been assigned to you. Please review the details below:</p>

            <div class=""ticket-info priority-{ticket.Priority.ToString().ToLower()}"">
                <h3>Ticket Details</h3>
                <p><strong>Ticket ID:</strong> {ticket.Key}</p>
                <p><strong>Title:</strong> {ticket.Title}</p>
                <p><strong>Priority:</strong> {ticket.Priority}</p>
                <p><strong>Severity:</strong> {ticket.Severity}</p>
                <p><strong>Status:</strong> {ticket.Status}</p>
                <p><strong>Project:</strong> {ticket.Project?.Name ?? "N/A"}</p>
                <p><strong>Reporter:</strong> {ticket.Reporter.Name} ({ticket.Reporter.Email})</p>
                <p><strong>Created:</strong> {ticket.CreatedAt:f}</p>
            </div>

            <div>
                <h4>Description:</h4>
                <p>{ticket.Description}</p>
            </div>

            <a href=""{baseUrl}/tickets/{ticket.Key}"" class=""button"">View Ticket</a>
        </div>
        <div class=""footer"">
            <p>This is an automated notification from SP Track Support System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(ticket.Assignee.Email, subject, emailBody);
        _logger.LogInformation("Assignment notification sent to {Email} for ticket {TicketKey}", ticket.Assignee.Email, ticket.Key);
    }

    private async Task SendTicketCreatedNotificationAsync(Ticket ticket)
    {
        // Implementation for ticket created notifications
        _logger.LogInformation("Created notification for ticket {TicketKey}", ticket.Key);
    }

    private async Task SendTicketUpdatedNotificationAsync(Ticket ticket)
    {
        // Implementation for ticket updated notifications
        _logger.LogInformation("Updated notification for ticket {TicketKey}", ticket.Key);
    }

    public async Task SendTestEmailAsync(string toEmail)
    {
        _logger.LogInformation("Processing test email job for {Email}", toEmail);

        var subject = "Test Email from SP Track System";
        var body = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ background-color: #28a745; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 30px; }}
        .success-icon {{ font-size: 48px; color: #28a745; text-align: center; margin: 20px 0; }}
        .button {{ display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ background-color: #f8f9fa; padding: 15px; text-align: center; color: #6c757d; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2>✅ SP Track Email Test Successful!</h2>
        </div>
        <div class=""content"">
            <div class=""success-icon"">📧</div>
            <h3>Email Configuration Working!</h3>
            <p>Congratulations! This test email confirms that:</p>

            <ul>
                <li>✅ SMTP configuration is correct</li>
                <li>✅ Office 365 authentication is working</li>
                <li>✅ Email delivery system is operational</li>
                <li>✅ Background job processing is functioning</li>
            </ul>

            <p><strong>What this means:</strong></p>
            <p>Your SP Track system is now fully configured to send email notifications when tickets are assigned to agents. All future ticket assignments will automatically trigger professional email notifications.</p>

            <p><strong>Test Details:</strong></p>
            <ul>
                <li>Sent to: {toEmail}</li>
                <li>Sent at: {DateTime.UtcNow:f} UTC</li>
                <li>From: SP Track Support System</li>
            </ul>

            <a href=""http://localhost:8080"" class=""button"">Access SP Track Dashboard</a>
        </div>
        <div class=""footer"">
            <p>This is a test email from SP Track Support System.</p>
            <p>Email notification system is working correctly.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, body);
        _logger.LogInformation("Test email sent successfully to {Email}", toEmail);
    }

    private async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var smtpHost = _configuration["SMTP__HOST"] ?? "smtp.office365.com";
            var smtpPort = _configuration["SMTP__PORT"] ?? "587";
            var smtpUser = _configuration["SMTP__USER"] ?? "abdul@spsolutions.org";
            var smtpPass = _configuration["SMTP__PASS"] ?? "jmvttpypbqmrsjbs";
            var smtpFrom = _configuration["SMTP__FROM"] ?? "abdul@spsolutions.org";

            var message = new MimeKit.MimeMessage();
            message.From.Add(new MimeKit.MailboxAddress("SP Track Support", smtpFrom));
            message.To.Add(new MimeKit.MailboxAddress("", to));
            message.Subject = subject;
            message.Body = new MimeKit.TextPart("html") { Text = body };

            using var client = new MailKit.Net.Smtp.SmtpClient();
            client.ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true;

            await client.ConnectAsync(smtpHost, int.Parse(smtpPort), MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
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