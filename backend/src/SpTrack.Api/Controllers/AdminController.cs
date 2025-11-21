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
            // ---------------------------
            // Configurable values
            // ---------------------------
            var systemTenantSlug = "system";
            var systemTenantName = "System Tenant";

            var demoTenantSlug = "demo";
            var demoTenantName = "Demo Organization";

            var adminEmail = "admin@spsolutions.ae";
            var adminPassword = "Admin@12345";

            var agentEmail = "abdul@spsolutions.org";
            var agentPassword = "Agent@12345";

            var customerEmail = "kapadia552@gmail.com";
            var customerPassword = "Customer@12345";

            // ---------------------------
            // STEP 0: Ensure system tenant exists
            // ---------------------------
            var systemTenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == systemTenantSlug);
            if (systemTenant == null)
            {
                systemTenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = systemTenantName,
                    Slug = systemTenantSlug,
                    Timezone = "UTC",
                    BusinessHoursJson = "{}",
                    LogoUrl = null,
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Tenants.Add(systemTenant);
                await _context.SaveChangesAsync(); // Save to get ID for role assignments
            }

            // ---------------------------
            // STEP 1: Create platform admin if not exists (assign Admin role scoped to system tenant)
            // ---------------------------
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

                var createResult = await _userManager.CreateAsync(admin, adminPassword);
                if (!createResult.Succeeded)
                {
                    return BadRequest(new { message = "Failed to create admin user", errors = createResult.Errors.Select(e => e.Description) });
                }
            }

            // Add admin role (scoped to system tenant) if not already present
            if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == admin.Id && ur.Role == "Admin" && ur.TenantId == systemTenant.Id))
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = admin.Id,
                    TenantId = systemTenant.Id,
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            // ---------------------------
            // STEP 2: Create demo tenant
            // ---------------------------
            var demoTenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == demoTenantSlug);
            if (demoTenant == null)
            {
                demoTenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = demoTenantName,
                    Slug = demoTenantSlug,
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
                await _context.SaveChangesAsync(); // Save so demoTenant.Id is available below
            }

            // ---------------------------
            // STEP 3: Create demo agent user
            // ---------------------------
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

                var createResult = await _userManager.CreateAsync(agent, agentPassword);
                if (!createResult.Succeeded)
                {
                    return BadRequest(new { message = "Failed to create agent user", errors = createResult.Errors.Select(e => e.Description) });
                }
            }

            // Assign Agent role in demo tenant
            if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == agent.Id && ur.Role == "Agent" && ur.TenantId == demoTenant.Id))
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = agent.Id,
                    TenantId = demoTenant.Id,
                    Role = "Agent",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // ---------------------------
            // STEP 4: Create demo customer user
            // ---------------------------
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

                var createResult = await _userManager.CreateAsync(customer, customerPassword);
                if (!createResult.Succeeded)
                {
                    return BadRequest(new { message = "Failed to create customer user", errors = createResult.Errors.Select(e => e.Description) });
                }
            }

            // Assign CustomerUser role in demo tenant
            if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == customer.Id && ur.Role == "CustomerUser" && ur.TenantId == demoTenant.Id))
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = customer.Id,
                    TenantId = demoTenant.Id,
                    Role = "CustomerUser",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // ALSO give the demo customer an Admin role in system tenant for testing (if desired)
            if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == customer.Id && ur.Role == "Admin" && ur.TenantId == systemTenant.Id))
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = customer.Id,
                    TenantId = systemTenant.Id,
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Save user role changes so downstream entities can reference users safely
            await _context.SaveChangesAsync();

            // ---------------------------
            // STEP 5: Create demo project
            // ---------------------------
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

            // ---------------------------
            // STEP 6: Create demo categories (parent and child)
            // ---------------------------
            var generalCategory = await _context.Categories.FirstOrDefaultAsync(c => c.TenantId == demoTenant.Id && c.Name == "General Support");
            if (generalCategory == null)
            {
                generalCategory = new Category
                {
                    Id = Guid.NewGuid(),
                    TenantId = demoTenant.Id,
                    Name = "General Support",
                    ParentId = null,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Categories.Add(generalCategory);
            }

            await _context.SaveChangesAsync(); // Ensure generalCategory.Id is available for child

            var technicalCategory = await _context.Categories.FirstOrDefaultAsync(c => c.TenantId == demoTenant.Id && c.Name == "Technical Issues");
            if (technicalCategory == null)
            {
                technicalCategory = new Category
                {
                    Id = Guid.NewGuid(),
                    TenantId = demoTenant.Id,
                    Name = "Technical Issues",
                    ParentId = generalCategory.Id,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Categories.Add(technicalCategory);
            }

            // ---------------------------
            // STEP 7: Create demo product
            // ---------------------------
            var demoProduct = await _context.Products.FirstOrDefaultAsync(p => p.TenantId == demoTenant.Id && p.Code == "MAIN");
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

            // ---------------------------
            // STEP 8: Create SLA policies
            // ---------------------------
            var anySlaForTenant = await _context.SlaPolicies.AnyAsync(s => s.TenantId == demoTenant.Id);
            if (!anySlaForTenant)
            {
                var slaPolicies = new[]
                {
                    new SlaPolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        Name = "P1 Critical SLA",
                        AppliesToJson = JsonSerializer.Serialize(new { Priority = new[] { "P1" } }),
                        FirstResponseMins = 60,
                        ResolveMins = 480,
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
                        FirstResponseMins = 240,
                        ResolveMins = 2880,
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
                        FirstResponseMins = 480,
                        ResolveMins = 7200,
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
                        FirstResponseMins = 960,
                        ResolveMins = 14400,
                        PauseOnWaitingCustomer = true,
                        Active = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };
                _context.SlaPolicies.AddRange(slaPolicies);
            }

            await _context.SaveChangesAsync();

            // ---------------------------
            // STEP 9: Create sample tickets (if none exist)
            // ---------------------------
            var existingTickets = await _context.Tickets.CountAsync(t => t.TenantId == demoTenant.Id);
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
                await _context.SaveChangesAsync();
            }

            // ---------------------------
            // STEP 10: Create sample comments
            // ---------------------------
            var firstTicket = await _context.Tickets.FirstOrDefaultAsync(t => t.Key == "DEMO-1" && t.TenantId == demoTenant.Id);
            var secondTicket = await _context.Tickets.FirstOrDefaultAsync(t => t.Key == "DEMO-2" && t.TenantId == demoTenant.Id);

            if (firstTicket != null)
            {
                var existingComments = await _context.Comments.CountAsync(c => c.TicketId == firstTicket.Id);
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
                var existingComments = await _context.Comments.CountAsync(c => c.TicketId == secondTicket.Id);
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

            // ---------------------------
            // STEP 11: Sample worklogs
            // ---------------------------
            if (secondTicket != null)
            {
                var existingWorklogs = await _context.Worklogs.CountAsync(w => w.TicketId == secondTicket.Id);
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
                            Minutes = 120,
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
                            Minutes = 60,
                            ActivityType = "Testing",
                            Billable = true,
                            Notes = "Testing email notification functionality",
                            CreatedAt = DateTime.UtcNow.AddHours(-2)
                        }
                    };
                    _context.Worklogs.AddRange(sampleWorklogs);
                }
            }

            await _context.SaveChangesAsync();

            // ---------------------------
            // STEP 12: Create SLA targets for tickets
            // ---------------------------
            var p2SlaPolicy = await _context.SlaPolicies.FirstOrDefaultAsync(s => s.Name == "P2 High SLA" && s.TenantId == demoTenant.Id);
            var p3SlaPolicy = await _context.SlaPolicies.FirstOrDefaultAsync(s => s.Name == "P3 Normal SLA" && s.TenantId == demoTenant.Id);

            if (firstTicket != null && p3SlaPolicy != null)
            {
                if (!await _context.SlaTargets.AnyAsync(st => st.TicketId == firstTicket.Id))
                {
                    _context.SlaTargets.Add(new SlaTarget
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        TicketId = firstTicket.Id,
                        SlaPolicyId = p3SlaPolicy.Id,
                        FirstResponseDueAt = firstTicket.CreatedAt.AddMinutes(p3SlaPolicy.FirstResponseMins),
                        ResolveDueAt = firstTicket.CreatedAt.AddMinutes(p3SlaPolicy.ResolveMins),
                        FirstResponseMet = true,
                        ResolveMet = false,
                        PausedAt = null,
                        CreatedAt = firstTicket.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            if (secondTicket != null && p2SlaPolicy != null)
            {
                if (!await _context.SlaTargets.AnyAsync(st => st.TicketId == secondTicket.Id))
                {
                    _context.SlaTargets.Add(new SlaTarget
                    {
                        Id = Guid.NewGuid(),
                        TenantId = demoTenant.Id,
                        TicketId = secondTicket.Id,
                        SlaPolicyId = p2SlaPolicy.Id,
                        FirstResponseDueAt = secondTicket.CreatedAt.AddMinutes(p2SlaPolicy.FirstResponseMins),
                        ResolveDueAt = secondTicket.CreatedAt.AddMinutes(p2SlaPolicy.ResolveMins),
                        FirstResponseMet = true,
                        ResolveMet = false,
                        PausedAt = null,
                        CreatedAt = secondTicket.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            // ---------------------------
            // STEP 13: Create custom fields for tenant
            // ---------------------------
            if (!await _context.TicketCustomFields.AnyAsync(f => f.TenantId == demoTenant.Id))
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

            // ---------------------------
            // Finished
            // ---------------------------
            return Ok(new
            {
                message = "Seed data created successfully",
                data = new
                {
                    systemTenant = new { slug = systemTenant.Slug, id = systemTenant.Id },
                    demoTenant = new { slug = demoTenant.Slug, id = demoTenant.Id },
                    adminEmail = adminEmail,
                    agentEmail = agentEmail,
                    customerEmail = customerEmail,
                    projectKey = demoProject.Key,
                    tickets = new[] { "DEMO-1", "DEMO-2" }
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error seeding data", error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    // =========================
    // ... rest of controller unchanged ...
    // (the remainder of your controller methods remain exactly as before)
    // =========================

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

    // ... (the rest of your existing endpoints)
    // For brevity I did not repeat the rest of unchanged endpoints here — keep your original code for them.
}
