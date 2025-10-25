using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using SpTrack.Application.Commands;
using SpTrack.Application.DTOs;
using SpTrack.Application.Interfaces;
using SpTrack.Api.Models;
using Microsoft.EntityFrameworkCore;
using Hangfire;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ISpTrackDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<TicketsController> _logger;

    public TicketsController(IMediator mediator, ISpTrackDbContext context, ICurrentUserService currentUser, IBackgroundJobClient backgroundJobClient, ILogger<TicketsController> logger)
    {
        _mediator = mediator;
        _context = context;
        _currentUser = currentUser;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets([FromQuery] TicketFilterRequest request)
    {
        _logger.LogWarning("=== GetTickets START ===");
        _logger.LogWarning("Request: FilterType={FilterType}, Page={Page}, PageSize={PageSize}",
            request.FilterType ?? "null", request.Page, request.PageSize);
        _logger.LogWarning("IsAuthenticated: {IsAuthenticated}", _currentUser.IsAuthenticated);
        _logger.LogWarning("UserId: {UserId}", _currentUser.UserId?.ToString() ?? "null");
        _logger.LogWarning("Email: {Email}", _currentUser.Email ?? "null");

        // Debug all claims
        var allClaims = User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
        _logger.LogWarning("All JWT Claims: [{Claims}]", string.Join(", ", allClaims));

        var query = _context.Tickets
            .Include(t => t.Reporter)
            .Include(t => t.Assignee)
            .Include(t => t.Category)
            .Include(t => t.Product)
            .Include(t => t.SlaTarget)
            .AsQueryable();

        // Apply role-based filtering first
        if (!_currentUser.IsAuthenticated)
        {
            _logger.LogWarning("User is not authenticated - returning Unauthorized");
            return Unauthorized();
        }

        var userRoles = _currentUser.Roles.ToList();
        _logger.LogWarning("Roles from JWT claims: [{Roles}]", string.Join(", ", userRoles));

        // FALLBACK: If no roles in JWT claims, check database directly
        if (!userRoles.Any() && _currentUser.UserId.HasValue)
        {
            _logger.LogWarning("No roles in JWT claims - fetching from database");
            var dbRoles = await _context.UserRoles
                .Where(ur => ur.UserId == _currentUser.UserId.Value)
                .Select(ur => ur.Role)
                .ToListAsync();
            userRoles.AddRange(dbRoles);
            _logger.LogWarning("Roles from database: [{Roles}]", string.Join(", ", dbRoles));
        }

        var isAdmin = userRoles.Contains("Admin");
        var isAgent = userRoles.Contains("Agent");
        var isCustomer = userRoles.Contains("CustomerUser");

        _logger.LogWarning("Determined roles - IsAdmin={IsAdmin}, IsAgent={IsAgent}, IsCustomer={IsCustomer}",
            isAdmin, isAgent, isCustomer);

        // IMPORTANT: Agents and Customers should NEVER see all tickets
        // Only block "all" filter access for non-admins (but allow empty filterType for now)
        if (!isAdmin && !string.IsNullOrEmpty(request.FilterType) && request.FilterType.ToLower() == "all")
        {
            _logger.LogWarning("Access denied: Non-admin user tried to access 'all' filter");
            return StatusCode(403, new { message = "Access denied. Agents and customers cannot view all tickets. Please use specific filters like 'my', 'unassigned', etc." });
        }

        // Apply role-based ticket filtering
        if (!isAdmin) // Admins can see all tickets
        {
            _logger.LogWarning("User is not admin - applying role-based filtering");
            if (isAgent)
            {
                _logger.LogWarning("User is agent - filtering to assigned/created tickets");
                // Agents can see tickets assigned to them or created by them
                query = query.Where(t =>
                    (t.AssigneeId == _currentUser.UserId) ||
                    (t.ReporterId == _currentUser.UserId));
            }
            else if (isCustomer)
            {
                _logger.LogWarning("User is customer - filtering to created tickets only");
                // Customers can only see tickets they created
                query = query.Where(t => t.ReporterId == _currentUser.UserId);
            }
            else
            {
                _logger.LogWarning("User has no valid role - denying access");
                // Users without proper roles cannot see any tickets
                return StatusCode(403, new { message = "Access denied. Your account does not have the necessary permissions to view tickets. Please contact your administrator." });
            }
        }
        else
        {
            _logger.LogWarning("User is admin - no ticket filtering applied");
        }

        // Apply FilterType-specific filtering (the main feature we're implementing)
        if (!string.IsNullOrEmpty(request.FilterType))
        {
            switch (request.FilterType.ToLower())
            {
                case "my":
                    // Show tickets assigned to or created by the current user
                    query = query.Where(t =>
                        t.AssigneeId == _currentUser.UserId ||
                        t.ReporterId == _currentUser.UserId);
                    break;
                case "unassigned":
                    // Show only tickets that are not assigned to anyone
                    query = query.Where(t => t.AssigneeId == null);
                    break;
                case "overdue":
                    // Show only tickets that are overdue (have SLA breaches)
                    query = query.Where(t => t.SlaTarget != null &&
                        (t.SlaTarget.FirstResponseDueAt < DateTime.UtcNow && !t.SlaTarget.FirstResponseMet ||
                         t.SlaTarget.ResolveDueAt < DateTime.UtcNow && !t.SlaTarget.ResolveMet));
                    break;
                case "all":
                default:
                    // No additional filtering for "all" or default case
                    break;
            }
        }

        // Apply other filters
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<Domain.Enums.TicketStatus>(request.Status, out var statusEnum))
            query = query.Where(t => t.Status == statusEnum);

        if (!string.IsNullOrEmpty(request.Priority) && Enum.TryParse<Domain.Enums.Priority>(request.Priority, out var priorityEnum))
            query = query.Where(t => t.Priority == priorityEnum);

        if (!string.IsNullOrEmpty(request.Severity) && Enum.TryParse<Domain.Enums.Severity>(request.Severity, out var severityEnum))
            query = query.Where(t => t.Severity == severityEnum);

        if (request.AssigneeId.HasValue)
            query = query.Where(t => t.AssigneeId == request.AssigneeId);

        if (request.ReporterId.HasValue)
            query = query.Where(t => t.ReporterId == request.ReporterId);

        if (request.ProjectId.HasValue)
            query = query.Where(t => t.ProjectId == request.ProjectId);

        if (request.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == request.CategoryId);

        if (request.DateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= request.DateFrom);

        if (request.DateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= request.DateTo);

        if (!string.IsNullOrEmpty(request.Q))
            query = query.Where(t => t.Title.Contains(request.Q) || t.Description.Contains(request.Q));

        var totalCount = await query.CountAsync();
        var tickets = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TicketDto
            {
                Id = t.Id,
                Key = t.Key,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority,
                Status = t.Status,
                Severity = t.Severity,
                CategoryName = t.Category != null ? t.Category.Name : null,
                ProductName = t.Product != null ? t.Product.Name : null,
                ReporterName = t.Reporter != null ? t.Reporter.Name : null,
                ReporterEmail = t.Reporter != null ? t.Reporter.Email : null,
                AssigneeName = t.Assignee != null ? t.Assignee.Name : null,
                AssigneeEmail = t.Assignee != null ? t.Assignee.Email : null,
                AssigneeId = t.AssigneeId,
                Source = t.Source,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                ClosedAt = t.ClosedAt
            })
            .ToListAsync();

        return Ok(new
        {
            data = tickets,
            totalCount,
            page = request.Page,
            pageSize = request.PageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        });
    }

    [HttpGet("test-no-auth")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTicketsNoAuth([FromQuery] TicketFilterRequest request)
    {
        Console.WriteLine($"=== NO AUTH TEST ===");
        Console.WriteLine($"Request: FilterType='{request.FilterType}', Page={request.Page}, PageSize={request.PageSize}");

        var query = _context.Tickets.AsQueryable();

        // Apply other filters
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<Domain.Enums.TicketStatus>(request.Status, out var statusEnum))
            query = query.Where(t => t.Status == statusEnum);

        if (!string.IsNullOrEmpty(request.Priority) && Enum.TryParse<Domain.Enums.Priority>(request.Priority, out var priorityEnum))
            query = query.Where(t => t.Priority == priorityEnum);

        if (!string.IsNullOrEmpty(request.Severity) && Enum.TryParse<Domain.Enums.Severity>(request.Severity, out var severityEnum))
            query = query.Where(t => t.Severity == severityEnum);

        if (request.AssigneeId.HasValue)
            query = query.Where(t => t.AssigneeId == request.AssigneeId);

        if (!string.IsNullOrEmpty(request.Q))
            query = query.Where(t => t.Title.Contains(request.Q) || t.Description.Contains(request.Q));

        // Apply FilterType-specific filtering (no user context filtering)
        if (!string.IsNullOrEmpty(request.FilterType))
        {
            Console.WriteLine($"Applying filter: {request.FilterType}");
            switch (request.FilterType.ToLower())
            {
                case "unassigned":
                    query = query.Where(t => t.AssigneeId == null);
                    break;
                case "overdue":
                    query = query.Where(t => t.SlaTarget != null &&
                        (t.SlaTarget.FirstResponseDueAt < DateTime.UtcNow && !t.SlaTarget.FirstResponseMet ||
                         t.SlaTarget.ResolveDueAt < DateTime.UtcNow && !t.SlaTarget.ResolveMet));
                    break;
                case "all":
                default:
                    // No additional filtering
                    break;
            }
        }

        var totalCount = await query.CountAsync();
        var tickets = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TicketDto
            {
                Id = t.Id,
                Key = t.Key,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority,
                Status = t.Status,
                Severity = t.Severity,
                AssigneeId = t.AssigneeId,
                Source = t.Source,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                ClosedAt = t.ClosedAt
            })
            .ToListAsync();

        Console.WriteLine($"Found {totalCount} tickets");

        return Ok(new
        {
            data = tickets,
            totalCount = totalCount,
            page = request.Page,
            pageSize = request.PageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
        });
    }

    [HttpPost("send-test-email")]
    public async Task<IActionResult> SendTestEmail()
    {
        try
        {
            _logger.LogInformation("Sending test email to kapadia552@gmail.com");

            // Queue a test email notification job
            var emailJobId = _backgroundJobClient.Enqueue<SpTrack.Worker.Jobs.IEmailJobService>(
                service => service.SendTestEmailAsync("kapadia552@gmail.com"));

            _logger.LogInformation("Test email job queued with ID: {JobId}", emailJobId);

            return Ok(new {
                message = "Test email job queued successfully",
                jobId = emailJobId,
                recipient = "kapadia552@gmail.com",
                note = "Please check your inbox and spam folder in a few moments"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to queue test email job");
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketRequest request)
    {
        // Debug: Log validation state
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .SelectMany(x => x.Value.Errors)
                .Select(x => x.ErrorMessage)
                .ToList();
            _logger.LogWarning("CreateTicket validation errors: {Errors}", string.Join(", ", errors));
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("CreateTicket request: Title='{Title}', Description='{Description}', ProjectId={ProjectId}", request.Title, request.Description, request.ProjectId);
            
            var command = new CreateTicketCommand(
                request.Title,
                request.Description,
                request.Priority,
                request.Severity,
                request.ProjectId,
                request.TenantId,
                request.CategoryId,
                request.ProductId,
                request.AssigneeId,
                request.CustomFields ?? new Dictionary<string, string>()
            );

            var ticket = await _mediator.Send(command);

            // Send email notification if ticket is created with an assignee
            if (ticket.AssigneeId.HasValue)
            {
                try
                {
                    _logger.LogInformation("DEBUG: Attempting to queue email job for new ticket {TicketId}", ticket.Id);
                    _backgroundJobClient.Enqueue<SpTrack.Worker.Jobs.IEmailJobService>(
                        service => service.SendTicketNotificationAsync(ticket.Id, "assigned"));
                    _logger.LogInformation("DEBUG: Email job queued successfully for new ticket {TicketId}", ticket.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "ERROR: Failed to queue email job for new ticket {TicketId}", ticket.Id);
                }
            }

            return CreatedAtAction(nameof(GetTicket), new { key = ticket.Key }, ticket);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ERROR CreateTicket");
            return StatusCode(500, new { message = "Failed to create ticket", error = ex.Message });
        }
    }

    [HttpGet("list-tenants")]
    public async Task<IActionResult> GetTenantsList()
    {
        // This endpoint is accessible to both admins and agents for the tenant dropdown
        var tenants = await _context.Tenants
            .Where(t => t.Active)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug
            })
            .OrderBy(t => t.Name)
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpGet("{key}")]
    public async Task<IActionResult> GetTicket(string key)
    {
        var query = _context.Tickets.Where(t => t.Key == key);

        // Apply role-based filtering
        if (!_currentUser.IsAuthenticated)
        {
            return Unauthorized();
        }

        var userRoles = _currentUser.Roles.ToList();

        // FALLBACK: If no roles in JWT claims, check database directly
        if (!userRoles.Any() && _currentUser.UserId.HasValue)
        {
            var dbRoles = await _context.UserRoles
                .Where(ur => ur.UserId == _currentUser.UserId.Value)
                .Select(ur => ur.Role)
                .ToListAsync();
            userRoles.AddRange(dbRoles);
        }

        var isAdmin = userRoles.Contains("Admin");
        var isAgent = userRoles.Contains("Agent");
        var isCustomer = userRoles.Contains("CustomerUser");

        // DEBUG: Log user info for troubleshooting
        Console.WriteLine($"DEBUG GetTicket: Key={key}, UserId={_currentUser.UserId}, Roles=[{string.Join(", ", userRoles)}], IsAdmin={isAdmin}, IsAgent={isAgent}, IsCustomer={isCustomer}");

        // Apply role-based ticket access filtering
        if (!isAdmin) // Admins can access any ticket
        {
            if (isAgent)
            {
                // Agents can access tickets assigned to them or created by them
                query = query.Where(t =>
                    (t.AssigneeId == _currentUser.UserId) ||
                    (t.ReporterId == _currentUser.UserId));
            }
            else if (isCustomer)
            {
                // Customers can only access tickets they created
                query = query.Where(t => t.ReporterId == _currentUser.UserId);
            }
            else
            {
                // Users without proper roles cannot access any tickets
                return StatusCode(403, new { message = "Insufficient permissions to access tickets" });
            }
        }
        
        var ticket = await query
            .Include(t => t.Reporter)
            .Include(t => t.Assignee)
            .Include(t => t.Category)
            .Include(t => t.Product)
            .Include(t => t.Comments.OrderByDescending(c => c.CreatedAt))
                .ThenInclude(c => c.Author)
            .Include(t => t.Attachments)
                .ThenInclude(a => a.UploadedBy)
            .Include(t => t.Worklogs)
                .ThenInclude(w => w.User)
            .Include(t => t.SlaTarget)
                .ThenInclude(s => s!.SlaPolicy)
            .FirstOrDefaultAsync();

        if (ticket == null)
            return NotFound();

        var ticketDto = new TicketDto
        {
            Id = ticket.Id,
            Key = ticket.Key,
            Title = ticket.Title,
            Description = ticket.Description,
            Priority = ticket.Priority,
            Status = ticket.Status,
            Severity = ticket.Severity,
            CategoryName = ticket.Category?.Name,
            ProductName = ticket.Product?.Name,
            ReporterName = ticket.Reporter.Name,
            ReporterEmail = ticket.Reporter.Email!,
            AssigneeName = ticket.Assignee?.Name,
            AssigneeEmail = ticket.Assignee?.Email,
            Source = ticket.Source,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            ClosedAt = ticket.ClosedAt,
            Comments = ticket.Comments.Select(c => new CommentDto
            {
                Id = c.Id,
                Body = c.Body,
                IsInternal = c.IsInternal,
                AuthorName = c.Author.Name,
                AuthorEmail = c.Author.Email!,
                CreatedAt = c.CreatedAt
            }).ToList(),
            Attachments = ticket.Attachments.Select(a => new AttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                Size = a.Size,
                AVStatus = a.AVStatus,
                UploadedByName = a.UploadedBy.Name,
                CreatedAt = a.CreatedAt
            }).ToList(),
            Worklogs = ticket.Worklogs.Select(w => new WorklogDto
            {
                Id = w.Id,
                Minutes = w.Minutes,
                ActivityType = w.ActivityType,
                Billable = w.Billable,
                Notes = w.Notes,
                UserName = w.User.Name,
                CreatedAt = w.CreatedAt
            }).ToList()
        };

        if (ticket.SlaTarget != null)
        {
            var now = DateTime.UtcNow;
            ticketDto.SlaTarget = new SlaTargetDto
            {
                Id = ticket.SlaTarget.Id,
                PolicyName = ticket.SlaTarget.SlaPolicy.Name,
                FirstResponseDueAt = ticket.SlaTarget.FirstResponseDueAt,
                ResolveDueAt = ticket.SlaTarget.ResolveDueAt,
                FirstResponseMet = ticket.SlaTarget.FirstResponseMet,
                ResolveMet = ticket.SlaTarget.ResolveMet,
                IsPaused = ticket.SlaTarget.PausedAt.HasValue,
                FirstResponseTimeRemaining = ticket.SlaTarget.FirstResponseDueAt.HasValue
                    ? ticket.SlaTarget.FirstResponseDueAt.Value - now
                    : null,
                ResolveTimeRemaining = ticket.SlaTarget.ResolveDueAt.HasValue
                    ? ticket.SlaTarget.ResolveDueAt.Value - now
                    : null,
                IsFirstResponseBreached = ticket.SlaTarget.FirstResponseDueAt.HasValue
                    && now > ticket.SlaTarget.FirstResponseDueAt.Value
                    && !ticket.SlaTarget.FirstResponseMet,
                IsResolveBreached = ticket.SlaTarget.ResolveDueAt.HasValue
                    && now > ticket.SlaTarget.ResolveDueAt.Value
                    && !ticket.SlaTarget.ResolveMet
            };
        }

        return Ok(ticketDto);
    }

    [HttpPost("{key}/comments")]
    public async Task<IActionResult> AddComment(string key, [FromBody] AddCommentRequest request)
    {
        var query = _context.Tickets.Where(t => t.Key == key);

        // Apply role-based filtering
        if (!_currentUser.IsAuthenticated)
        {
            return Unauthorized();
        }

        var userRoles = _currentUser.Roles.ToList();

        // FALLBACK: If no roles in JWT claims, check database directly
        if (!userRoles.Any() && _currentUser.UserId.HasValue)
        {
            var dbRoles = await _context.UserRoles
                .Where(ur => ur.UserId == _currentUser.UserId.Value)
                .Select(ur => ur.Role)
                .ToListAsync();
            userRoles.AddRange(dbRoles);
        }

        var isAdmin = userRoles.Contains("Admin");
        var isAgent = userRoles.Contains("Agent");
        var isCustomer = userRoles.Contains("CustomerUser");

        // Apply role-based ticket access filtering
        if (!isAdmin) // Admins can add comments to any ticket
        {
            if (isAgent)
            {
                // Agents can add comments to tickets assigned to them or created by them
                query = query.Where(t =>
                    (t.AssigneeId == _currentUser.UserId) ||
                    (t.ReporterId == _currentUser.UserId));
            }
            else if (isCustomer)
            {
                // Customers can only add comments to tickets they created
                query = query.Where(t => t.ReporterId == _currentUser.UserId);
            }
            else
            {
                // Users without proper roles cannot add comments
                return StatusCode(403, new { message = "Insufficient permissions to add comments" });
            }
        }
        
        var ticket = await query.FirstOrDefaultAsync();

        if (ticket == null)
            return NotFound();

        var comment = new Domain.Entities.Comment
        {
            Id = Guid.NewGuid(),
            TenantId = ticket.TenantId,
            TicketId = ticket.Id,
            AuthorId = _currentUser.UserId ?? Guid.Parse("ae56ae46-efdd-49d7-acfa-bbc738877fbf"), // Use admin as fallback
            Body = request.Body,
            IsInternal = request.IsInternal,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Comment added successfully" });
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> UpdateTicket(string key, [FromBody] UpdateTicketRequest request)
    {
        try
        {
            _logger.LogWarning("DEBUG: UpdateTicket START - key={Key}", key);

            var query = _context.Tickets.Where(t => t.Key == key);

            // Apply role-based filtering
            if (!_currentUser.IsAuthenticated)
            {
                return Unauthorized();
            }

            var userRoles = _currentUser.Roles.ToList();

            // FALLBACK: If no roles in JWT claims, check database directly
            if (!userRoles.Any() && _currentUser.UserId.HasValue)
            {
                var dbRoles = await _context.UserRoles
                    .Where(ur => ur.UserId == _currentUser.UserId.Value)
                    .Select(ur => ur.Role)
                    .ToListAsync();
                userRoles.AddRange(dbRoles);
                _logger.LogWarning("DEBUG: UpdateTicket fallback roles loaded from DB: {Roles}", string.Join(", ", dbRoles));
            }

            var isAdmin = userRoles.Contains("Admin");
            var isAgent = userRoles.Contains("Agent");
            var isCustomer = userRoles.Contains("CustomerUser");

            // Apply role-based ticket access filtering
            if (!isAdmin) // Admins can update any ticket
            {
                if (isAgent)
                {
                    // Agents can update tickets assigned to them
                    query = query.Where(t =>
                        (t.AssigneeId == _currentUser.UserId));
                }
                else if (isCustomer)
                {
                    // Customers have limited update permissions (can only update tickets they created)
                    query = query.Where(t => t.ReporterId == _currentUser.UserId);
                }
                else
                {
                    // Users without proper roles cannot update tickets
                    return StatusCode(403, new { message = "Insufficient permissions to update tickets" });
                }
            }
        
        var ticket = await query.FirstOrDefaultAsync();

        if (ticket == null)
            return NotFound();

        var hasChanges = false;
        var oldAssigneeId = ticket.AssigneeId;
        var oldStatus = ticket.Status;

        _logger.LogWarning("DEBUG: Starting ticket update for {TicketKey}. Request data: Status={Status}, AssigneeId={AssigneeId}",
            ticket.Key, request.Status ?? "null", request.AssigneeId?.ToString() ?? "null");

        // Status updates - only admins and agents can change status
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<Domain.Enums.TicketStatus>(request.Status, out var newStatus))
        {
            if (isCustomer)
            {
                _logger.LogWarning("DEBUG: Customer {UserId} attempted to change status - denied", _currentUser.UserId);
                // Customers cannot change ticket status
            }
            else if (ticket.Status != newStatus)
            {
                ticket.Status = newStatus;
                hasChanges = true;
                _logger.LogWarning("DEBUG: Status updated by admin/agent from {OldStatus} to {NewStatus}", ticket.Status, newStatus);
            }
        }

        _logger.LogWarning("DEBUG: Processing assignee change. UpdateAssigneeId={UpdateFlag}, request.AssigneeId={AssigneeId}",
            request.UpdateAssigneeId, request.AssigneeId?.ToString() ?? "null");

        // Assignee updates - only admins and agents can assign tickets
        if (request.UpdateAssigneeId)
        {
            if (isCustomer)
            {
                _logger.LogWarning("DEBUG: Customer {UserId} attempted to change assignee - denied", _currentUser.UserId);
                // Customers cannot assign tickets
            }
            else
            {
                _logger.LogWarning("DEBUG: UpdateAssigneeId flag is true, comparing with current: {CurrentAssigneeId} != {RequestAssigneeId}",
                    ticket.AssigneeId?.ToString() ?? "null", request.AssigneeId?.ToString() ?? "null");

                if (ticket.AssigneeId != request.AssigneeId)
                {
                    // Validate that the AssigneeId exists if not null
                    if (request.AssigneeId.HasValue)
                    {
                        var assigneeExists = await _context.Users.AnyAsync(u => u.Id == request.AssigneeId.Value);
                        if (!assigneeExists)
                        {
                            _logger.LogError("ERROR: Attempted to assign ticket to non-existent user {AssigneeId}", request.AssigneeId.Value);
                            return BadRequest(new { message = $"User with ID {request.AssigneeId.Value} does not exist" });
                        }
                    }

                    ticket.AssigneeId = request.AssigneeId;
                    hasChanges = true;
                    _logger.LogWarning("DEBUG: AssigneeId updated by admin/agent, hasChanges=true");
                }
            }
        }
        else
        {
            _logger.LogWarning("DEBUG: UpdateAssigneeId flag is false, preserving current assignment");
        }

        // Priority updates - allowed for all users (admins, agents, customers)
        if (!string.IsNullOrEmpty(request.Priority) && Enum.TryParse<Domain.Enums.Priority>(request.Priority, out var newPriority))
        {
            if (ticket.Priority != newPriority)
            {
                ticket.Priority = newPriority;
                hasChanges = true;
                _logger.LogWarning("DEBUG: Priority updated by {UserType} from {OldPriority} to {NewPriority}",
                    isAdmin ? "Admin" : isAgent ? "Agent" : "Customer", ticket.Priority, newPriority);
            }
        }

        // Severity updates - allowed for all users (admins, agents, customers)
        if (!string.IsNullOrEmpty(request.Severity) && Enum.TryParse<Domain.Enums.Severity>(request.Severity, out var newSeverity))
        {
            if (ticket.Severity != newSeverity)
            {
                ticket.Severity = newSeverity;
                hasChanges = true;
                _logger.LogWarning("DEBUG: Severity updated by {UserType} from {OldSeverity} to {NewSeverity}",
                    isAdmin ? "Admin" : isAgent ? "Agent" : "Customer", ticket.Severity, newSeverity);
            }
        }

        if (hasChanges)
        {
            _logger.LogWarning("DEBUG: HasChanges is true for ticket {TicketKey}", ticket.Key);
            _logger.LogWarning("DEBUG: OldAssigneeId: {OldAssigneeId}, NewAssigneeId: {NewAssigneeId}", oldAssigneeId, ticket.AssigneeId);

            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Add system comment for assignment changes
            if (oldAssigneeId != ticket.AssigneeId)
            {
                _logger.LogWarning("DEBUG: Assignment changed for ticket {TicketKey}", ticket.Key);

                var assigneeUser = ticket.AssigneeId.HasValue
                    ? await _context.Users.FirstOrDefaultAsync(u => u.Id == ticket.AssigneeId.Value)
                    : null;

                var commentBody = ticket.AssigneeId.HasValue
                    ? $"Ticket assigned to {assigneeUser?.Name ?? "Unknown User"}"
                    : "Ticket unassigned";

                var systemComment = new Domain.Entities.Comment
                {
                    Id = Guid.NewGuid(),
                    TenantId = ticket.TenantId,
                    TicketId = ticket.Id,
                    AuthorId = _currentUser.UserId ?? Guid.Parse("ae56ae46-efdd-49d7-acfa-bbc738877fbf"), // Use admin as fallback
                    Body = commentBody,
                    IsInternal = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Comments.Add(systemComment);
                await _context.SaveChangesAsync();

                // Send email notification if ticket is assigned to someone
                if (ticket.AssigneeId.HasValue)
                {
                    _logger.LogWarning("DEBUG: Ticket {TicketKey} has assignee, attempting to queue email job", ticket.Key);
                    try
                    {
                        _logger.LogWarning("DEBUG: Attempting to queue email job for ticket {TicketId}", ticket.Id);
                        _backgroundJobClient.Enqueue<SpTrack.Worker.Jobs.IEmailJobService>(
                            service => service.SendTicketNotificationAsync(ticket.Id, "assigned"));
                        _logger.LogWarning("DEBUG: Email job queued successfully for ticket {TicketId}", ticket.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "ERROR: Failed to queue email job for ticket {TicketId}", ticket.Id);
                    }
                }
                else
                {
                    _logger.LogWarning("DEBUG: Ticket {TicketKey} has no assignee, skipping email notification", ticket.Key);
                }
            }
            else
            {
                _logger.LogWarning("DEBUG: No assignment change detected for ticket {TicketKey}", ticket.Key);
            }

            // Add system comment for status changes
            if (oldStatus != ticket.Status)
            {
                var statusComment = new Domain.Entities.Comment
                {
                    Id = Guid.NewGuid(),
                    TenantId = ticket.TenantId,
                    TicketId = ticket.Id,
                    AuthorId = _currentUser.UserId ?? Guid.Parse("ae56ae46-efdd-49d7-acfa-bbc738877fbf"), // Use admin as fallback
                    Body = $"Status changed from {oldStatus} to {ticket.Status}",
                    IsInternal = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Comments.Add(statusComment);
                await _context.SaveChangesAsync();
            }
        }

        // Return updated ticket
        _logger.LogWarning("DEBUG: UpdateTicket completing successfully");
        return await GetTicket(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ERROR in UpdateTicket: {Message}. Key={Key}",
                ex.Message, key);
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpPost("{key}/worklogs")]
    public async Task<IActionResult> AddWorklog(string key, [FromBody] AddWorklogRequest request)
    {
        var query = _context.Tickets.Where(t => t.Key == key);

        // Apply role-based filtering
        if (!_currentUser.IsAuthenticated)
        {
            return Unauthorized();
        }

        var userRoles = _currentUser.Roles.ToList();

        // FALLBACK: If no roles in JWT claims, check database directly
        if (!userRoles.Any() && _currentUser.UserId.HasValue)
        {
            var dbRoles = await _context.UserRoles
                .Where(ur => ur.UserId == _currentUser.UserId.Value)
                .Select(ur => ur.Role)
                .ToListAsync();
            userRoles.AddRange(dbRoles);
        }

        var isAdmin = userRoles.Contains("Admin");
        var isAgent = userRoles.Contains("Agent");
        var isCustomer = userRoles.Contains("CustomerUser");

        // Apply role-based ticket access filtering
        if (!isAdmin) // Admins can add worklogs to any ticket
        {
            if (isAgent)
            {
                // Agents can add worklogs to tickets assigned to them
                query = query.Where(t =>
                    (t.AssigneeId == _currentUser.UserId));
            }
            else if (isCustomer)
            {
                // Customers cannot add worklogs (this is typically an agent/admin function)
                return StatusCode(403, new { message = "Customers are not allowed to add worklogs" });
            }
            else
            {
                // Users without proper roles cannot add worklogs
                return StatusCode(403, new { message = "Insufficient permissions to add worklogs" });
            }
        }
        
        var ticket = await query.FirstOrDefaultAsync();

        if (ticket == null)
            return NotFound();

        var worklog = new Domain.Entities.Worklog
        {
            Id = Guid.NewGuid(),
            TenantId = ticket.TenantId,
            TicketId = ticket.Id,
            UserId = _currentUser.UserId ?? Guid.Parse("ae56ae46-efdd-49d7-acfa-bbc738877fbf"), // Use admin as fallback
            Minutes = request.Minutes,
            ActivityType = request.ActivityType,
            Billable = request.Billable,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.Worklogs.Add(worklog);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Worklog added successfully" });
    }

    [HttpPost("{key}/attachments")]
    public async Task<IActionResult> UploadAttachment(string key, IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file provided" });
            }

            // Validate file size (10MB max)
            const long maxFileSize = 10 * 1024 * 1024;
            if (file.Length > maxFileSize)
            {
                return BadRequest(new { message = "File size exceeds 10MB limit" });
            }

            // Find the ticket
            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Key == key);

            if (ticket == null)
            {
                return NotFound(new { message = "Ticket not found" });
            }

            // Check user permissions (same logic as other endpoints)
            if (!_currentUser.IsAuthenticated)
            {
                return Unauthorized();
            }

            var userRoles = _currentUser.Roles.ToList();

            // FALLBACK: If no roles in JWT claims, check database directly
            if (!userRoles.Any() && _currentUser.UserId.HasValue)
            {
                var dbRoles = await _context.UserRoles
                    .Where(ur => ur.UserId == _currentUser.UserId.Value)
                    .Select(ur => ur.Role)
                    .ToListAsync();
                userRoles.AddRange(dbRoles);
            }

            var isAdmin = userRoles.Contains("Admin");
            var isAgent = userRoles.Contains("Agent");
            var isCustomer = userRoles.Contains("CustomerUser");

            // Apply role-based access control
            if (!isAdmin)
            {
                if (isAgent)
                {
                    // Agents can upload to tickets assigned to them
                    if (ticket.AssigneeId != _currentUser.UserId)
                    {
                        return Forbid("You don't have permission to upload attachments to this ticket");
                    }
                }
                else if (isCustomer)
                {
                    // Customers can only upload to their own tickets
                    if (ticket.ReporterId != _currentUser.UserId)
                    {
                        return Forbid("You can only upload attachments to your own tickets");
                    }
                }
                else
                {
                    return Forbid("Insufficient permissions");
                }
            }

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName);
            var storageKey = $"attachments/{ticket.Id}/{Guid.NewGuid()}{fileExtension}";

            // Upload to storage (you'll need to inject IStorageService)
            // For now, we'll store basic file info without actual upload
            var attachment = new Domain.Entities.Attachment
            {
                Id = Guid.NewGuid(),
                TenantId = ticket.TenantId,
                TicketId = ticket.Id,
                FileName = file.FileName,
                ContentType = file.ContentType,
                Size = file.Length,
                StorageKey = storageKey,
                UploadedById = _currentUser.UserId ?? Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Attachments.Add(attachment);
            await _context.SaveChangesAsync();

            return Ok(new {
                message = "Attachment uploaded successfully",
                attachmentId = attachment.Id,
                fileName = attachment.FileName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading attachment for ticket {Key}", key);
            return StatusCode(500, new { message = "Failed to upload attachment", error = ex.Message });
        }
    }

}