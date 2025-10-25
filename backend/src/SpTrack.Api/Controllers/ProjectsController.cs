using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly ISpTrackDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ProjectsController(ISpTrackDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        var projects = await _context.Projects
            .Where(p => p.Active)
            .Select(p => new
            {
                id = p.Id,
                key = p.Key,
                name = p.Name,
                description = p.Description
            })
            .ToListAsync();

        return Ok(projects);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
    {
        if (!_currentUser.Roles.Contains("Admin") && !_currentUser.Roles.Contains("TeamLead"))
            return Forbid();

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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        var project = await _context.Projects
            .Where(p => p.Id == id)
            .FirstOrDefaultAsync();

        if (project == null)
            return NotFound();

        return Ok(project);
    }

    [HttpGet("~/api/users")]
    public async Task<IActionResult> GetUsers()
    {
        // Return all active users
        var query = _context.Users.Where(u => u.Active);
        
        var users = await query
            .Select(u => new
            {
                id = u.Id,
                name = u.Name,
                email = u.Email,
                isInternal = u.IsInternal
            })
            .OrderBy(u => u.name)
            .ToListAsync();

        return Ok(users);
    }
}

public class CreateProjectRequest
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}