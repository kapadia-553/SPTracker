using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace SpTrack.Api.Services;

public class MagicLinkService : IMagicLinkService
{
    private readonly ISpTrackDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MagicLinkService> _logger;

    public MagicLinkService(
        ISpTrackDbContext context,
        UserManager<User> userManager,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<MagicLinkService> logger)
    {
        _context = context;
        _userManager = userManager;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendMagicLinkAsync(string email, string? tenantSlug = null)
    {
        try
        {
            // Check if user exists
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("Magic link requested for non-existent user: {Email}", email);
                // Don't reveal if user exists or not - always return success
                return;
            }

            // Generate a secure token
            var token = GenerateSecureToken();

            // Store the magic link token in database
            var magicLinkToken = new MagicLinkToken
            {
                Id = Guid.NewGuid(),
                Email = email,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // 15 minutes expiry
                CreatedAt = DateTime.UtcNow
            };

            _context.MagicLinkTokens.Add(magicLinkToken);
            await _context.SaveChangesAsync();

            // Send the magic link email
            var baseUrl = _configuration["APP-BASE-URL"] ?? "http://localhost:5000";
            var magicLinkUrl = $"{GetPortalBaseUrl()}/auth/magic-link/consume?token={token}";

            var emailSubject = "Sign in to SP Track";
            var emailBody = GenerateEmailBody("SP Track", magicLinkUrl, user.Name);
            _logger.LogInformation("Sending magic link email");
            await _emailService.SendAsync(email, emailSubject, emailBody);

            _logger.LogInformation("Magic link sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send magic link to {Email}", email);
            throw;
        }
    }

    public async Task SendInternalMagicLinkAsync(string email)
    {
        try
        {
            // Check if user exists and is internal
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null || !user.IsInternal)
            {
                _logger.LogWarning("Internal magic link requested for non-existent or customer user: {Email}", email);
                // Don't reveal if user exists or not - always return success
                return;
            }

            // Generate a secure token
            var token = GenerateSecureToken();

            // Store the magic link token in database
            var magicLinkToken = new MagicLinkToken
            {
                Id = Guid.NewGuid(),
                Email = email,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // 15 minutes expiry
                CreatedAt = DateTime.UtcNow
            };

            _context.MagicLinkTokens.Add(magicLinkToken);
            await _context.SaveChangesAsync();

            // Determine portal URL based on user role
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.Role)
                .ToListAsync();

            var isAdmin = userRoles.Contains("Admin");
            var portalUrl = GetPortalBaseUrl(isAdmin);

            // Send the magic link email
            var magicLinkUrl = $"{portalUrl}/auth/magic-link/consume?token={token}";

            var emailSubject = "Sign in to SP Track - Internal Access";
            var emailBody = GenerateInternalEmailBody(magicLinkUrl, user.Name);

            _logger.LogInformation("Sending internal magic link email to {Email} (Admin: {IsAdmin})", email, isAdmin);
            await _emailService.SendAsync(email, emailSubject, emailBody);

            _logger.LogInformation("Internal magic link sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send internal magic link to {Email}", email);
            throw;
        }
    }

    public async Task<User?> ConsumeMagicLinkAsync(string token)
    {
        try
        {
            // Find and validate the token
            var magicLinkToken = await _context.MagicLinkTokens
                .FirstOrDefaultAsync(mlt => mlt.Token == token && mlt.ConsumedAt == null);

            if (magicLinkToken == null)
            {
                _logger.LogWarning("Invalid magic link token attempted: {Token}", token);
                return null;
            }

            // Check if token has expired
            if (magicLinkToken.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogWarning("Expired magic link token attempted: {Token}", token);
                return null;
            }

            // Find the user
            var user = await _userManager.FindByEmailAsync(magicLinkToken.Email);
            if (user == null)
            {
                _logger.LogWarning("Magic link token for non-existent user: {Email}", magicLinkToken.Email);
                return null;
            }

            // Mark token as consumed
            magicLinkToken.ConsumedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Magic link consumed successfully for user {Email}", user.Email);
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to consume magic link token: {Token}", token);
            return null;
        }
    }

    private string GenerateSecureToken()
    {
        // Generate a cryptographically secure random token
        const int tokenLength = 32;
        var randomBytes = new byte[tokenLength];

        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }

        // Convert to URL-safe base64 string
        return Convert.ToBase64String(randomBytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private string GetPortalBaseUrl(bool isAdmin = false)
    {
        // Return the appropriate portal URL based on user role
        // Check configuration first, fall back to defaults
        if (isAdmin)
        {
            return _configuration["PORTAL__ADMIN_URL"] ?? "http://localhost:8080";
        }
        else
        {
            return _configuration["PORTAL__AGENT_URL"] ?? "http://localhost:8081";
        }
    }

    private string GenerateEmailBody(string tenantName, string magicLinkUrl, string userName)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
    <title>Sign in to {tenantName}</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
        .footer {{ color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }}
        .warning {{ background-color: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; padding: 15px; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class=""header"">
        <h1>SP Track</h1>
        <p>Sign in to {tenantName}</p>
    </div>
    
    <div class=""content"">
        <p>Hello {userName},</p>
        
        <p>You requested to sign in to your support portal for <strong>{tenantName}</strong>. Click the button below to securely access your account:</p>
        
        <p style=""text-align: center;"">
            <a href=""{magicLinkUrl}"" class=""button"">Sign In to SP Track</a>
        </p>
        
        <div class=""warning"">
            <strong>Security Notice:</strong> This link will expire in 15 minutes and can only be used once. If you didn't request this sign-in link, you can safely ignore this email.
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style=""word-break: break-all; background-color: #f1f1f1; padding: 10px; border-radius: 4px;"">
            {magicLinkUrl}
        </p>
        
        <p>Need help? Contact your support team.</p>
    </div>
    
    <div class=""footer"">
        <p>This email was sent by SP Track on behalf of {tenantName}.</p>
        <p>If you're having trouble with the magic link, please contact your administrator.</p>
    </div>
</body>
</html>";
    }

    private string GenerateInternalEmailBody(string magicLinkUrl, string userName)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
    <title>Internal Access - SP Track</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #374151; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background-color: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
        .footer {{ color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }}
        .warning {{ background-color: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; padding: 15px; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class=""header"">
        <h1>SP Track</h1>
        <p>Internal Access Login</p>
    </div>
    
    <div class=""content"">
        <p>Hello {userName},</p>
        
        <p>You requested internal access to SP Track. Click the button below to securely sign in to your internal dashboard:</p>
        
        <p style=""text-align: center;"">
            <a href=""{magicLinkUrl}"" class=""button"">Access SP Track Dashboard</a>
        </p>
        
        <div class=""warning"">
            <strong>Security Notice:</strong> This link will expire in 15 minutes and can only be used once. If you didn't request this sign-in link, please contact your system administrator immediately.
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style=""word-break: break-all; background-color: #f1f1f1; padding: 10px; border-radius: 4px;"">
            {magicLinkUrl}
        </p>
        
        <p>Need help? Contact your system administrator.</p>
    </div>
    
    <div class=""footer"">
        <p>This email was sent by SP Track Internal System.</p>
        <p>If you're having trouble with the magic link, please contact your system administrator.</p>
    </div>
</body>
</html>";
    }
}