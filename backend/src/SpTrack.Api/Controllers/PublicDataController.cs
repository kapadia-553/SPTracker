using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicDataController : ControllerBase
{
    private readonly ISpTrackDbContext _context;

    public PublicDataController(ISpTrackDbContext context)
    {
        _context = context;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants()
    {
        try
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
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        try
        {
            var users = await _context.Users
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
                        .Include(ur => ur.Tenant)
                        .Select(ur => new
                        {
                            Role = ur.Role,
                            TenantId = ur.TenantId,
                            TenantName = ur.Tenant != null ? ur.Tenant.Name : null
                        })
                        .ToList(),
                    TicketCount = _context.Tickets.Count(t => t.AssigneeId == u.Id)
                })
                .OrderBy(u => u.Name)
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}