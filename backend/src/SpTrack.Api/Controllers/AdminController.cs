using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SpTrack.Api.Models;
using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;
using SpTrack.Domain.Enums;
using System.Text;
using System.Text.Json;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly ISpTrackDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly ICurrentUserService _currentUser;

    public AdminController(ISpTrackDbContext context, UserManager<User> userManager, ICurrentUserService currentUser)
    {
        _context = context;
        _userManager = userManager;
        _currentUser = currentUser;
    }

    [HttpGet("simple-test")]
    public IActionResult SimpleTest()
    {
        return Ok(new { message = "This endpoint works without authentication!", timestamp = DateTime.UtcNow });
    }

    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new { 
            message = "API is working", 
            timestamp = DateTime.UtcNow,
            isAuthenticated = _currentUser.IsAuthenticated,
            userId = _currentUser.UserId,
            roles = _currentUser.Roles.ToList(),
            email = _currentUser.Email,
            isInternal = _currentUser.IsInternal
        });
    }

    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        return Ok(new
        {
            UserId = _currentUser.UserId,
            Email = _currentUser.Email,
            Roles = _currentUser.Roles.ToList(),
            IsAuthenticated = _currentUser.IsAuthenticated,
            IsInternal = _currentUser.IsInternal
        });
    }

    [HttpPost("seed")]
    [AllowAnonymous]
    public async Task<IActionResult> SeedData()
    {
        try
        {
            // Step 1: Create platform admin if not exists
            var adminEmail = "admin@spsolutions.ae";
            var admin = await _userManager.FindByEmailAsync(adminEmail);

            if (admin == null)
            {
                admin = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = adminEmail,
                    Email = adminEmail,
                    Name = "Platform Administrator",
                    IsInternal = true,
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var createResult = await _userManager.CreateAsync(admin, "Admin@12345");
                if (!createResult.Succeeded)
                {
                    return BadRequest($"Failed to create admin user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                }

                // Add admin role (global admin - no tenant)
                var adminRole = new UserRole
                {
                    UserId = admin.Id,
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserRoles.Add(adminRole);
            }

            // Step 2: Create demo tenant
            var demoTenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == "demo");
            if (demoTenant == null)
            {
                demoTenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = "Demo Organization",
                    Slug = "demo",
                    Timezone = "Asia/Dubai",
                    BusinessHoursJson = JsonSerializer.Serialize(new
                    {
                        Sunday = new { Start = "09:00", End = "18:00" },
                        Monday = new { Start = "09:00", End = "18:00" },
                        Tuesday = new { Start = "09:00", End = "18:00" },
                        Wednesday = new { Start = "09:00", End = "18:00" },
                        Thursday = new { Start = "09:00", End = "18:00" },
                        Friday = (object?)null,
                        Saturday = (object?)null
                    }),
                    LogoUrl = null,
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Tenants.Add(demoTenant);
            }

            // IMPORTANT: Save tenant first before creating tenant-scoped entities
            await _context.SaveChangesAsync();

            // Step 3: Create demo agent
            var agentEmail = "abdul@spsolutions.org";
            var agent = await _userManager.FindByEmailAsync(agentEmail);
            if (agent == null)
            {
                agent = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = agentEmail,
                    Email = agentEmail,
                    Name = "Demo Agent",
                    IsInternal = true,
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var createResult = await _userManager.CreateAsync(agent, "Agent@12345");
                if (!createResult.Succeeded)
                {
                    return BadRequest($"Failed to create agent user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                }
            }

            // Step 4: Create demo customer
            var customerEmail = "kapadia552@gmail.com";
            var customer = await _userManager.FindByEmailAsync(customerEmail);
            if (customer == null)
            {
                customer = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = customerEmail,
                    Email = customerEmail,
                    Name = "Demo Customer",
                    IsInternal = false,
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var createResult = await _userManager.CreateAsync(customer, "Customer@12345");
                if (!createResult.Succeeded)
                {
                    return BadRequest($"Failed to create customer user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                }
            }

            // Step 5: Create user roles with existing tenant reference
            var existingAgentRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == agent.Id && ur.TenantId == demoTenant.Id);
            if (existingAgentRole == null)
            {
                var agentRole = new UserRole
                {
                    UserId = agent.Id,
                    Role = "Agent",
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserRoles.Add(agentRole);
            }

            var existingCustomerRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == customer.Id && ur.TenantId == demoTenant.Id);
            if (existingCustomerRole == null)
            {
                var customerRole = new UserRole
                {
                    UserId = customer.Id,
                    Role = "CustomerUser",
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserRoles.Add(customerRole);
            }

            // Step 5b: Also add Admin role to kapadia552@gmail.com for testing
            var existingAdminRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == customer.Id && ur.Role == "Admin");
            if (existingAdminRole == null)
            {
                var adminRole = new UserRole
                {
                    UserId = customer.Id,
                    Role = "Admin",
                    TenantId = null, // Global admin - no tenant restriction
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserRoles.Add(adminRole);
            }

            // Step 6: Create demo project
            var demoProject = await _context.Projects.FirstOrDefaultAsync(p => p.Key == "DEMO");
            if (demoProject == null)
            {
                demoProject = new Project
                {
                    Id = Guid.NewGuid(),
                    Key = "DEMO",
                    Name = "Demo Project",
                    Description = "Demo project for testing SP Track",
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Projects.Add(demoProject);
            }

            // Step 7: Create demo categories (parent and child)
            var generalCategory = await _context.Categories.FirstOrDefaultAsync(c => c.TenantId == demoTenant.Id && c.Name == "General Support");
            if (generalCategory == null)
            {
                generalCategory = new Category
                {
                    Id = Guid.NewGuid(),
                    TenantId = demoTenant.Id,
                    Name = "General Support",
                    ParentId = null, // Root category
                    CreatedAt = DateTime.UtcNow
                };
                _context.Categories.Add(generalCategory);
            }

            // Save to get the category ID for child categories
            await _context.SaveChangesAsync();

            var technicalCategory = await _context.Categories.FirstOrDefaultAsync(c => c.TenantId == demoTenant.Id && c.Name == "Technical Issues");
            if (technicalCategory == null)
            {
                technicalCategory = new Category
                {
                    Id = Guid.NewGuid(),
                    TenantId = demoTenant.Id,
                    Name = "Technical Issues",
                    ParentId = generalCategory.Id, // Child of General Support
                    CreatedAt = DateTime.UtcNow
                };
                _context.Categories.Add(technicalCategory);
            }

            // Step 8: Create demo product
            var demoProduct = await _context.Products.FirstOrDefaultAsync(p => p.TenantId == demoTenant.Id);
            if (demoProduct == null)
            {
                demoProduct = new Product
                {
                    Id = Guid.NewGuid(),
                    TenantId = demoTenant.Id,
                    Code = "MAIN",
                    Name = "Main Product",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Products.Add(demoProduct);
            }

            // Step 9: Create SLA policies
            var existingSlaPolicy = await _context.SlaPolicies.FirstOrDefaultAsync(s => s.TenantId == demoTenant.Id);
            if (existingSlaPolicy == null)
            {
                var slaPolicies = new[]
                {
                    new SlaPolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        Name = "P1 Critical SLA",
                        AppliesToJson = JsonSerializer.Serialize(new { Priority = new[] { "P1" } }),
                        FirstResponseMins = 60, // 1 hour
                        ResolveMins = 480, // 8 hours
                        PauseOnWaitingCustomer = true,
                        Active = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new SlaPolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        Name = "P2 High SLA",
                        AppliesToJson = JsonSerializer.Serialize(new { Priority = new[] { "P2" } }),
                        FirstResponseMins = 240, // 4 hours
                        ResolveMins = 2880, // 2 business days
                        PauseOnWaitingCustomer = true,
                        Active = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new SlaPolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        Name = "P3 Normal SLA",
                        AppliesToJson = JsonSerializer.Serialize(new { Priority = new[] { "P3" } }),
                        FirstResponseMins = 480, // 8 hours
                        ResolveMins = 7200, // 5 business days
                        PauseOnWaitingCustomer = true,
                        Active = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new SlaPolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        Name = "P4 Low SLA",
                        AppliesToJson = JsonSerializer.Serialize(new { Priority = new[] { "P4" } }),
                        FirstResponseMins = 960, // 16 hours
                        ResolveMins = 14400, // 10 business days
                        PauseOnWaitingCustomer = true,
                        Active = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                _context.SlaPolicies.AddRange(slaPolicies);
            }

            // Save before creating tickets that might need SLA policies
            await _context.SaveChangesAsync();

            // Step 10: Create sample tickets
            var existingTickets = await _context.Tickets.Where(t => t.TenantId == demoTenant.Id).CountAsync();
            if (existingTickets == 0)
            {
                var sampleTickets = new[]
                {
                    new Ticket
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        ProjectId = demoProject.Id,
                        Key = "DEMO-1",
                        Title = "Welcome to SP Track Demo",
                        Description = "This is a sample ticket to demonstrate the system functionality. You can edit, comment, and manage this ticket to explore the features.",
                        Priority = Priority.P3,
                        Severity = Severity.Medium,
                        Status = TicketStatus.New,
                        CategoryId = generalCategory.Id,
                        ProductId = demoProduct.Id,
                        ReporterId = customer.Id,
                        AssigneeId = null,
                        Source = TicketSource.Web,
                        CreatedAt = DateTime.UtcNow.AddDays(-2),
                        UpdatedAt = DateTime.UtcNow.AddDays(-2),
                        ClosedAt = null
                    },
                    new Ticket
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        ProjectId = demoProject.Id,
                        Key = "DEMO-2",
                        Title = "System Configuration Request",
                        Description = "Request to configure email notifications and custom fields for the project.",
                        Priority = Priority.P2,
                        Severity = Severity.High,
                        Status = TicketStatus.InProgress,
                        CategoryId = technicalCategory.Id,
                        ProductId = demoProduct.Id,
                        ReporterId = customer.Id,
                        AssigneeId = agent.Id,
                        Source = TicketSource.Web,
                        CreatedAt = DateTime.UtcNow.AddDays(-1),
                        UpdatedAt = DateTime.UtcNow.AddDays(-1),
                        ClosedAt = null
                    }
                };

                _context.Tickets.AddRange(sampleTickets);
            }

            // Save to get ticket IDs for related entities
            await _context.SaveChangesAsync();

            // Step 11: Create sample comments
            var firstTicket = await _context.Tickets.FirstOrDefaultAsync(t => t.Key == "DEMO-1");
            var secondTicket = await _context.Tickets.FirstOrDefaultAsync(t => t.Key == "DEMO-2");

            if (firstTicket != null)
            {
                var existingComments = await _context.Comments.Where(c => c.TicketId == firstTicket.Id).CountAsync();
                if (existingComments == 0)
                {
                    var sampleComments = new[]
                    {
                        new Comment
                        {
                            Id = Guid.NewGuid(),
                            TenantId = demoTenant.Id,
                            TicketId = firstTicket.Id,
                            AuthorId = agent.Id,
                            Body = "Thank you for your ticket. We have received your request and will respond shortly.",
                            IsInternal = false,
                            CreatedAt = DateTime.UtcNow.AddDays(-1)
                        },
                        new Comment
                        {
                            Id = Guid.NewGuid(),
                            TenantId = demoTenant.Id,
                            TicketId = firstTicket.Id,
                            AuthorId = agent.Id,
                            Body = "Internal note: This looks like a standard demo ticket request.",
                            IsInternal = true,
                            CreatedAt = DateTime.UtcNow.AddHours(-12)
                        }
                    };

                    _context.Comments.AddRange(sampleComments);
                }
            }

            if (secondTicket != null)
            {
                var existingComments = await _context.Comments.Where(c => c.TicketId == secondTicket.Id).CountAsync();
                if (existingComments == 0)
                {
                    var comment = new Comment
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        TicketId = secondTicket.Id,
                        AuthorId = agent.Id,
                        Body = "Started working on the email configuration. Will update you with progress.",
                        IsInternal = false,
                        CreatedAt = DateTime.UtcNow.AddHours(-8)
                    };

                    _context.Comments.Add(comment);
                }
            }

            // Step 12: Create sample worklogs
            if (secondTicket != null)
            {
                var existingWorklogs = await _context.Worklogs.Where(w => w.TicketId == secondTicket.Id).CountAsync();
                if (existingWorklogs == 0)
                {
                    var sampleWorklogs = new[]
                    {
                        new Worklog
                        {
                            Id = Guid.NewGuid(),
                            TenantId = demoTenant.Id,
                            TicketId = secondTicket.Id,
                            UserId = agent.Id,
                            Minutes = 120, // 2 hours
                            ActivityType = "Development",
                            Billable = true,
                            Notes = "Initial analysis and configuration setup",
                            CreatedAt = DateTime.UtcNow.AddHours(-6)
                        },
                        new Worklog
                        {
                            Id = Guid.NewGuid(),
                            TenantId = demoTenant.Id,
                            TicketId = secondTicket.Id,
                            UserId = agent.Id,
                            Minutes = 60, // 1 hour
                            ActivityType = "Testing",
                            Billable = true,
                            Notes = "Testing email notification functionality",
                            CreatedAt = DateTime.UtcNow.AddHours(-2)
                        }
                    };

                    _context.Worklogs.AddRange(sampleWorklogs);
                }
            }

            // Step 13: Create SLA targets for tickets
            var p2SlaPolicy = await _context.SlaPolicies.FirstOrDefaultAsync(s => s.Name == "P2 High SLA" && s.TenantId == demoTenant.Id);
            var p3SlaPolicy = await _context.SlaPolicies.FirstOrDefaultAsync(s => s.Name == "P3 Normal SLA" && s.TenantId == demoTenant.Id);

            if (firstTicket != null && p3SlaPolicy != null)
            {
                var existingSlaTarget = await _context.SlaTargets.FirstOrDefaultAsync(st => st.TicketId == firstTicket.Id);
                if (existingSlaTarget == null)
                {
                    var slaTarget = new SlaTarget
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        TicketId = firstTicket.Id,
                        SlaPolicyId = p3SlaPolicy.Id,
                        FirstResponseDueAt = firstTicket.CreatedAt.AddMinutes(p3SlaPolicy.FirstResponseMins),
                        ResolveDueAt = firstTicket.CreatedAt.AddMinutes(p3SlaPolicy.ResolveMins),
                        FirstResponseMet = true, // Agent already responded
                        ResolveMet = false,
                        PausedAt = null,
                        CreatedAt = firstTicket.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.SlaTargets.Add(slaTarget);
                }
            }

            if (secondTicket != null && p2SlaPolicy != null)
            {
                var existingSlaTarget = await _context.SlaTargets.FirstOrDefaultAsync(st => st.TicketId == secondTicket.Id);
                if (existingSlaTarget == null)
                {
                    var slaTarget = new SlaTarget
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        TicketId = secondTicket.Id,
                        SlaPolicyId = p2SlaPolicy.Id,
                        FirstResponseDueAt = secondTicket.CreatedAt.AddMinutes(p2SlaPolicy.FirstResponseMins),
                        ResolveDueAt = secondTicket.CreatedAt.AddMinutes(p2SlaPolicy.ResolveMins),
                        FirstResponseMet = true, // Agent already responded
                        ResolveMet = false,
                        PausedAt = null,
                        CreatedAt = secondTicket.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.SlaTargets.Add(slaTarget);
                }
            }

            // Step 14: Create custom fields for tickets
            var existingCustomField = await _context.TicketCustomFields.FirstOrDefaultAsync(f => f.TenantId == demoTenant.Id);
            if (existingCustomField == null)
            {
                var customFields = new[]
                {
                    new TicketCustomField
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        Name = "Customer Environment",
                        Type = "select",
                        OptionsJson = JsonSerializer.Serialize(new[] { "Production", "Staging", "Development" }),
                        Required = false,
                        Scope = "all",
                        CreatedAt = DateTime.UtcNow
                    },
                    new TicketCustomField
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        Name = "Urgency Level",
                        Type = "select",
                        OptionsJson = JsonSerializer.Serialize(new[] { "Low", "Medium", "High", "Critical" }),
                        Required = true,
                        Scope = "technical",
                        CreatedAt = DateTime.UtcNow
                    }
                };

                _context.TicketCustomFields.AddRange(customFields);
            }

            // Final save for all remaining entities
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Seed data created successfully",
                data = new
                {
                    adminEmail = adminEmail,
                    agentEmail = agentEmail,
                    customerEmail = customerEmail,
                    tenantSlug = demoTenant.Slug,
                    projectKey = demoProject.Key,
                    tickets = new[] { "DEMO-1", "DEMO-2" },
                    categories = new[] { "General Support", "Technical Issues" },
                    slaPolicies = 4,
                    comments = 3,
                    worklogs = 2,
                    customFields = 2
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error seeding data", error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpPost("tenants/{id}/export")]
    public async Task<IActionResult> ExportTenantData(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null)
            return NotFound();

        // Export all tenant data
        var tenantData = new
        {
            Tenant = tenant,
            Users = await _context.UserRoles.Where(ur => ur.TenantId == id).Include(ur => ur.User).ToListAsync(),
            Projects = await _context.Projects.ToListAsync(),
            Tickets = await _context.Tickets.Where(t => t.TenantId == id)
               .Include(t => t.Comments)
               .Include(t => t.Attachments)
               .Include(t => t.Worklogs)
               .Include(t => t.SlaTarget)
               .ToListAsync(),
            Categories = await _context.Categories.Where(c => c.TenantId == id).ToListAsync(),
            Products = await _context.Products.Where(p => p.TenantId == id).ToListAsync(),
            SlaPolicies = await _context.SlaPolicies.Where(s => s.TenantId == id).ToListAsync(),
            SlaTargets = await _context.SlaTargets.Where(st => st.TenantId == id).ToListAsync(),
            TicketCustomFields = await _context.TicketCustomFields.Where(f => f.TenantId == id).ToListAsync()
        };

        var json = JsonSerializer.Serialize(tenantData, new JsonSerializerOptions { WriteIndented = true });
        var bytes = Encoding.UTF8.GetBytes(json);

        return File(bytes, "application/json", $"tenant_{tenant.Slug}_export_{DateTime.UtcNow:yyyyMMdd}.json");
    }

    // ===== TENANT/ORGANIZATION MANAGEMENT =====
    
    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants()
    {

        var tenants = await _context.Tenants
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                t.Timezone,
                t.Active,
                t.CreatedAt,
                t.UpdatedAt,
                UserCount = _context.UserRoles.Count(ur => ur.TenantId == t.Id),
                ProjectCount = _context.Projects.Count(),
                TicketCount = _context.Tickets.Count(tk => tk.TenantId == t.Id)
            })
            .OrderBy(t => t.Name)
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpGet("tenants/{id}")]
    public async Task<IActionResult> GetTenant(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null)
            return NotFound();

        return Ok(tenant);
    }

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
    {
        // Validate model state first
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { message = "Validation failed", errors = errors });
        }

        // Skip admin check for now
        // Check if slug already exists
        var existingTenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == request.Slug);
        if (existingTenant != null)
            return BadRequest(new { message = "A tenant with this slug already exists" });

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = request.Slug,
            Timezone = request.Timezone ?? "UTC",
            BusinessHoursJson = request.BusinessHoursJson ?? "{}",
            LogoUrl = request.LogoUrl,
            Active = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTenant), new { id = tenant.Id }, tenant);
    }

    [HttpPut("tenants/{id}")]
    public async Task<IActionResult> UpdateTenant(Guid id, [FromBody] UpdateTenantRequest request)
    {
        // Validate model state first
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { message = "Validation failed", errors = errors });
        }

        // Skip admin check for now
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null)
            return NotFound(new { message = "Tenant not found" });

        // Check if slug already exists (excluding current tenant)
        if (tenant.Slug != request.Slug)
        {
            var existingTenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == request.Slug);
            if (existingTenant != null)
                return BadRequest(new { message = "A tenant with this slug already exists" });
        }

        tenant.Name = request.Name;
        tenant.Slug = request.Slug;
        tenant.Timezone = request.Timezone ?? tenant.Timezone;
        tenant.BusinessHoursJson = request.BusinessHoursJson ?? tenant.BusinessHoursJson;
        tenant.LogoUrl = request.LogoUrl;
        tenant.Active = request.Active;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(tenant);
    }

    [HttpDelete("tenants/{id}")]
    public async Task<IActionResult> DeleteTenant(Guid id)
    {
        // Skip admin check for now
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null)
            return NotFound(new { message = "Tenant not found" });

        // Check if tenant has tickets
        var hasTickets = await _context.Tickets.AnyAsync(t => t.TenantId == id);
        if (hasTickets)
            return BadRequest(new { message = "Cannot delete tenant with existing tickets. Deactivate instead." });

        // Delete related data
        var userRoles = await _context.UserRoles.Where(ur => ur.TenantId == id).ToListAsync();
        _context.UserRoles.RemoveRange(userRoles);

        // Projects are now tenant-independent, so we don't delete them when deleting a tenant

        var categories = await _context.Categories.Where(c => c.TenantId == id).ToListAsync();
        _context.Categories.RemoveRange(categories);

        var products = await _context.Products.Where(p => p.TenantId == id).ToListAsync();
        _context.Products.RemoveRange(products);

        _context.Tenants.Remove(tenant);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ===== USER MANAGEMENT =====
    
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] Guid? tenantId = null)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var query = _context.Users.AsQueryable();

        var users = await query
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.IsInternal,
                u.Active,
                u.CreatedAt,
                u.UpdatedAt,
                Roles = _context.UserRoles
    .Where(ur => ur.UserId == u.Id)
.Select(ur => new { ur.Role })
                    .ToList(),
                TicketCount = _context.Tickets.Count(t => t.ReporterId == u.Id || t.AssigneeId == u.Id)
            })
            .OrderBy(u => u.Name)
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Tenant)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound();

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.IsInternal,
            user.Active,
            user.CreatedAt,
            user.UpdatedAt,
            Roles = user.UserRoles.Select(ur => new
            {
                ur.Role
            }).ToList()
        });
    }

    [HttpGet("test-auth")]
    public IActionResult TestAuth()
    {
        return Ok(new { message = "Auth test works", timestamp = DateTime.UtcNow });
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        // Log the incoming request for debugging
        Console.WriteLine($"CreateUser request received: Email={request?.Email}, Name={request?.Name}");
        
        // Validate model state first
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            Console.WriteLine($"Validation errors: {string.Join(", ", errors)}");
            return BadRequest(new { message = "Validation failed", errors = errors });
        }

        // Skip admin check for now
        
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            Console.WriteLine($"User already exists with email: {request.Email}");
            return BadRequest(new { message = "A user with this email already exists" });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
            IsInternal = request.IsInternal,
            Active = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errorMessages = result.Errors.Select(e => e.Description).ToList();
            Console.WriteLine($"User creation failed: {string.Join(", ", errorMessages)}");
            return BadRequest(new { message = "User creation failed", errors = errorMessages });
        }

        // Add roles if provided
        if (request.Roles?.Any() == true)
        {
            Console.WriteLine($"DEBUG CreateUser: Processing {request.Roles.Count} roles for user {user.Id}");

            foreach (var role in request.Roles)
            {
                Console.WriteLine($"DEBUG CreateUser: Role={role.Role}, TenantId={role.TenantId?.ToString() ?? "NULL"}");

                // System-wide roles (Admin, Agent, TeamLead) use a special system tenant ID
                // Customer roles require a real TenantId
                var isSystemRole = role.Role == "Admin" || role.Role == "Agent" || role.Role == "TeamLead";
                var isCustomerRole = role.Role == "CustomerUser";

                if (isCustomerRole && role.TenantId == null)
                {
                    Console.WriteLine($"ERROR: Customer role requires TenantId but it's null. Skipping this role assignment.");
                    continue;
                }

                // For system roles, use null TenantId; for customer roles, use the provided TenantId
                var tenantIdToUse = isSystemRole ? null : role.TenantId;

                Console.WriteLine($"DEBUG: Role {role.Role} - IsSystemRole: {isSystemRole}, Using TenantId: {tenantIdToUse?.ToString() ?? "NULL"}");

                // Check if role already exists to avoid duplicate key errors
                var existingRole = await _context.UserRoles.FirstOrDefaultAsync(ur =>
                    ur.UserId == user.Id &&
                    ur.Role == role.Role &&
                    ur.TenantId == tenantIdToUse);

                if (existingRole != null)
                {
                    Console.WriteLine($"Role {role.Role} already exists for user with this TenantId");
                    continue;
                }

                var userRole = new UserRole
                {
                    UserId = user.Id,
                    TenantId = tenantIdToUse,
                    Role = role.Role,
                    CreatedAt = DateTime.UtcNow
                };

                Console.WriteLine($"Adding role: {role.Role}, UserId: {user.Id}, TenantId: {tenantIdToUse?.ToString() ?? "NULL"}");
                _context.UserRoles.Add(userRole);
            }
            
            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine("User roles saved successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving user roles: {ex.Message}");
                // Return error but don't fail the entire user creation since user was already created
                return StatusCode(500, new { message = "User created but failed to assign roles", error = ex.Message });
            }
        }

        return StatusCode(201, new {
            message = "User created successfully",
            userId = user.Id,
            email = user.Email,
            name = user.Name
        });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound();

        // Check if email already exists (excluding current user)
        if (user.Email != request.Email)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                return BadRequest("A user with this email already exists");
        }

        user.Name = request.Name;
        user.Email = request.Email;
        user.UserName = request.Email;
        user.IsInternal = request.IsInternal;
        user.Active = request.Active;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));

        // Update roles if provided
        if (request.Roles != null)
        {
            Console.WriteLine($"DEBUG UpdateUser: Processing {request.Roles.Count} roles for user {user.Id}");

            // Use raw SQL to avoid Entity Framework foreign key issues
            if (_context is DbContext dbContext)
            {
                // Delete existing roles
                await dbContext.Database.ExecuteSqlRawAsync(
                    "DELETE FROM \"UserRoles\" WHERE \"UserId\" = {0}",
                    user.Id);

                // Insert new roles
                foreach (var role in request.Roles)
                {
                    Console.WriteLine($"DEBUG UpdateUser: Role={role.Role}, TenantId={role.TenantId?.ToString() ?? "NULL"}");

                    // System-wide roles (Admin, Agent, TeamLead) use a special system tenant ID
                    // Customer roles require a real TenantId
                    var isSystemRole = role.Role == "Admin" || role.Role == "Agent" || role.Role == "TeamLead";
                    var isCustomerRole = role.Role == "CustomerUser";

                    if (isCustomerRole && role.TenantId == null)
                    {
                        Console.WriteLine($"ERROR: Customer role requires TenantId but it's null. Skipping this role assignment.");
                        continue;
                    }

                    // For system roles, use null TenantId; for customer roles, use the provided TenantId
                    var tenantIdToUse = isSystemRole ? null : role.TenantId;

                    Console.WriteLine($"DEBUG: Role {role.Role} - IsSystemRole: {isSystemRole}, Using TenantId: {tenantIdToUse?.ToString() ?? "NULL"}");

                    await dbContext.Database.ExecuteSqlRawAsync(
                        "INSERT INTO \"UserRoles\" (\"UserId\", \"TenantId\", \"Role\", \"CreatedAt\") VALUES ({0}, {1}, {2}, {3})",
                        user.Id,
                        tenantIdToUse,
                        role.Role,
                        DateTime.UtcNow);
                }
            }
        }

        return Ok(new { message = "User updated successfully", userId = user.Id });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound();

        // Check if user has tickets
        var hasTickets = await _context.Tickets.AnyAsync(t => t.ReporterId == id || t.AssigneeId == id);
        if (hasTickets)
            return BadRequest("Cannot delete user with existing tickets. Deactivate instead.");

        // Remove user roles
        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == id).ToListAsync();
        _context.UserRoles.RemoveRange(userRoles);

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));

        return NoContent();
    }

    // ===== PROJECT MANAGEMENT =====
    
    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects()
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var projects = await _context.Projects
            .Select(p => new
            {
                p.Id,
                p.Key,
                p.Name,
                p.Description,
                p.Active,
                p.CreatedAt,
                p.UpdatedAt,
                TicketCount = _context.Tickets.Count(t => t.ProjectId == p.Id)
            })
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("projects/{id}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
            return NotFound();

        return Ok(project);
    }

    [HttpPost("projects")]
    public async Task<IActionResult> CreateProject([FromBody] AdminCreateProjectRequest request)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        // Check if project key already exists
        var existingProject = await _context.Projects
            .FirstOrDefaultAsync(p => p.Key == request.Key);
        if (existingProject != null)
            return BadRequest("A project with this key already exists");

        var project = new Project
        {
            Id = Guid.NewGuid(),
            Key = request.Key.ToUpper(),
            Name = request.Name,
            Description = request.Description,
            Active = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    [HttpPut("projects/{id}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] AdminUpdateProjectRequest request)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var project = await _context.Projects.FindAsync(id);
        if (project == null)
            return NotFound();

        // Check if project key already exists (excluding current project)
        if (project.Key != request.Key)
        {
            var existingProject = await _context.Projects
                .FirstOrDefaultAsync(p => p.Key == request.Key);
            if (existingProject != null)
                return BadRequest("A project with this key already exists");
        }

        project.Key = request.Key.ToUpper();
        project.Name = request.Name;
        project.Description = request.Description;
        project.Active = request.Active;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(project);
    }

    [HttpDelete("projects/{id}")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var project = await _context.Projects.FindAsync(id);
        if (project == null)
            return NotFound();

        // Check if project has tickets
        var hasTickets = await _context.Tickets.AnyAsync(t => t.ProjectId == id);
        if (hasTickets)
            return BadRequest("Cannot delete project with existing tickets. Deactivate instead.");

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ===== CATEGORY MANAGEMENT =====
    
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories([FromQuery] Guid? tenantId = null)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var query = _context.Categories.AsQueryable();
        
        if (tenantId.HasValue)
            query = query.Where(c => c.TenantId == tenantId.Value);

        var categories = await query
            .Include(c => c.Tenant)
            .Include(c => c.Parent)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.TenantId,
                TenantName = c.Tenant.Name,
                c.ParentId,
                ParentName = c.Parent != null ? c.Parent.Name : null,
                c.CreatedAt,
                ChildCount = _context.Categories.Count(ch => ch.ParentId == c.Id),
                TicketCount = _context.Tickets.Count(t => t.CategoryId == c.Id)
            })
            .OrderBy(c => c.TenantId).ThenBy(c => c.Name)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("categories/{id}")]
    public async Task<IActionResult> GetCategory(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var category = await _context.Categories
            .Include(c => c.Tenant)
            .Include(c => c.Parent)
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.TenantId,
                TenantName = c.Tenant.Name,
                c.ParentId,
                ParentName = c.Parent != null ? c.Parent.Name : null,
                c.CreatedAt,
                ChildCount = _context.Categories.Count(ch => ch.ParentId == c.Id),
                TicketCount = _context.Tickets.Count(t => t.CategoryId == c.Id)
            })
            .FirstOrDefaultAsync();

        if (category == null)
            return NotFound();

        return Ok(category);
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] AdminCreateCategoryRequest request)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        // Check if category name already exists
        var existingCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.Name == request.Name);
        if (existingCategory != null)
            return BadRequest("A category with this name already exists");

        // Validate parent exists within same tenant if provided
        if (request.ParentId.HasValue)
        {
            var parent = await _context.Categories.FindAsync(request.ParentId.Value);
            if (parent == null || parent.TenantId != request.TenantId)
                return BadRequest("Parent category not found or belongs to different tenant");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ParentId = request.ParentId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        // Return the category with the same projection as GetCategories to match frontend expectations
        var createdCategory = await _context.Categories
            .Include(c => c.Tenant)
            .Include(c => c.Parent)
            .Where(c => c.Id == category.Id)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.TenantId,
                TenantName = c.Tenant.Name,
                c.ParentId,
                ParentName = c.Parent != null ? c.Parent.Name : null,
                c.CreatedAt,
                ChildCount = _context.Categories.Count(ch => ch.ParentId == c.Id),
                TicketCount = _context.Tickets.Count(t => t.CategoryId == c.Id)
            })
            .FirstAsync();

        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, createdCategory);
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] AdminUpdateCategoryRequest request)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        // Check if category name already exists (excluding current category)
        if (category.Name != request.Name)
        {
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == request.Name);
            if (existingCategory != null)
                return BadRequest("A category with this name already exists");
        }

        // Validate parent exists within same tenant if provided and prevent circular reference
        if (request.ParentId.HasValue)
        {
            if (request.ParentId.Value == id)
                return BadRequest("Category cannot be its own parent");

            var parent = await _context.Categories.FindAsync(request.ParentId.Value);
            if (parent == null || parent.TenantId != category.TenantId)
                return BadRequest("Parent category not found or belongs to different tenant");

            // Check for circular reference
            var currentParent = parent;
            while (currentParent != null)
            {
                if (currentParent.ParentId == id)
                    return BadRequest("This would create a circular reference");
                currentParent = currentParent.ParentId.HasValue 
                    ? await _context.Categories.FindAsync(currentParent.ParentId.Value) 
                    : null;
            }
        }

        category.Name = request.Name;
        category.ParentId = request.ParentId;

        await _context.SaveChangesAsync();
        return Ok(category);
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var category = await _context.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound();

        // Check if category has tickets
        var hasTickets = await _context.Tickets.AnyAsync(t => t.CategoryId == id);
        if (hasTickets)
            return BadRequest("Cannot delete category with existing tickets.");

        // Check if category has children
        if (category.Children.Any())
            return BadRequest("Cannot delete category with child categories. Delete children first.");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ===== PRODUCT MANAGEMENT =====
    
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] Guid? tenantId = null)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var query = _context.Products.AsQueryable();
        
        if (tenantId.HasValue)
            query = query.Where(p => p.TenantId == tenantId.Value);

        var products = await query
            .Include(p => p.Tenant)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.Name,
                p.TenantId,
                TenantName = p.Tenant.Name,
                p.CreatedAt,
                TicketCount = _context.Tickets.Count(t => t.ProductId == p.Id)
            })
            .OrderBy(p => p.TenantId).ThenBy(p => p.Name)
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProduct(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var product = await _context.Products
            .Include(p => p.Tenant)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound();

        return Ok(product);
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] AdminCreateProductRequest request)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        // Check if product code already exists
        var existingProduct = await _context.Products
            .FirstOrDefaultAsync(p => p.Code == request.Code);
        if (existingProduct != null)
            return BadRequest("A product with this code already exists");

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Code = request.Code.ToUpper(),
            Name = request.Name,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] AdminUpdateProductRequest request)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound();

        // Check if product code already exists (excluding current product)
        if (product.Code != request.Code)
        {
            var existingProduct = await _context.Products
                .FirstOrDefaultAsync(p => p.Code == request.Code);
            if (existingProduct != null)
                return BadRequest("A product with this code already exists");
        }

        product.Code = request.Code.ToUpper();
        product.Name = request.Name;

        await _context.SaveChangesAsync();
        return Ok(product);
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        //if (!_currentUser.Roles.Contains("Admin"))
        //    return Forbid(); // Temporarily disabled for testing

        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound();

        // Check if product has tickets
        var hasTickets = await _context.Tickets.AnyAsync(t => t.ProductId == id);
        if (hasTickets)
            return BadRequest("Cannot delete product with existing tickets.");

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}