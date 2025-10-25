using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly ISpTrackDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ProductsController(ISpTrackDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _context.Products
            .Select(p => new
            {
                id = p.Id,
                code = p.Code,
                name = p.Name
            })
            .ToListAsync();

        return Ok(products);
    }
}