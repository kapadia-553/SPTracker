using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.Extensions;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "Test API is working", timestamp = DateTime.UtcNow });
    }

    [HttpGet("data")]
    public IActionResult GetData()
    {
        return Ok(new {
            organizations = 5,
            users = 10,
            message = "This should work without authentication"
        });
    }

    [HttpGet("debug")]
    [AllowAnonymous]
    public IActionResult Debug()
    {
        var queryParams = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
        var result = new
        {
            message = "Debug endpoint working",
            timestamp = DateTime.UtcNow,
            queryParams = queryParams,
            url = Request.GetDisplayUrl()
        };

        Console.WriteLine($"DEBUG ENDPOINT HIT: {Request.GetDisplayUrl()}");
        Console.WriteLine($"Query params: {string.Join(", ", queryParams.Select(kv => $"{kv.Key}={kv.Value}"))}");

        return Ok(result);
    }
}