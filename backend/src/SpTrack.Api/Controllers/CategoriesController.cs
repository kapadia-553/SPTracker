using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ISpTrackDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CategoriesController(ISpTrackDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                parentId = c.ParentId
            })
            .ToListAsync();

        return Ok(categories);
    }
}