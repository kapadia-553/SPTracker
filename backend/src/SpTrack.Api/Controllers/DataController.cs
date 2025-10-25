using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DataController : ControllerBase
{
    private readonly ISpTrackDbContext _context;

    public DataController(ISpTrackDbContext context)
    {
        _context = context;
    }

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

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
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

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.TenantId,
                TenantName = c.Tenant != null ? c.Tenant.Name : null,
                c.ParentId,
                ParentName = c.Parent != null ? c.Parent.Name : null,
                c.CreatedAt,
                ChildCount = _context.Categories.Count(cat => cat.ParentId == c.Id),
                TicketCount = _context.Tickets.Count(t => t.CategoryId == c.Id)
            })
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _context.Products
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.Name,
                p.TenantId,
                TenantName = p.Tenant != null ? p.Tenant.Name : null,
                p.CreatedAt,
                TicketCount = _context.Tickets.Count(t => t.ProductId == p.Id)
            })
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(products);
    }
}