using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using SpTrack.Domain.Entities;
using SpTrack.Api.Services;
using SpTrack.Api.Models;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IMagicLinkService _magicLinkService;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IJwtTokenService jwtTokenService,
        IMagicLinkService magicLinkService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _magicLinkService = magicLinkService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsInternal)
            return Unauthorized("Invalid credentials");

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
            return Unauthorized("Invalid credentials");

        var token = await _jwtTokenService.GenerateTokenAsync(user);
        return Ok(new { token });
    }

    [HttpPost("magic-link")]
    [AllowAnonymous]
    public async Task<IActionResult> RequestMagicLink([FromBody] MagicLinkRequest request)
    {
        try
        {
            await _magicLinkService.SendMagicLinkAsync(request.Email, request.TenantSlug);
            return Ok(new { message = "Magic link sent to your email" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to send magic link. Please try again later." });
        }
    }

    [HttpPost("internal-magic-link")]
    [AllowAnonymous]
    public async Task<IActionResult> RequestInternalMagicLink([FromBody] InternalMagicLinkRequest request)
    {
        try
        {
            await _magicLinkService.SendInternalMagicLinkAsync(request.Email);
            return Ok(new { message = "Magic link sent to your email" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to send magic link. Please try again later." });
        }
    }

    [HttpGet("magic-link/consume")]
    [AllowAnonymous]
    public async Task<IActionResult> ConsumeMagicLink([FromQuery] string token)
    {
        try
        {
            var user = await _magicLinkService.ConsumeMagicLinkAsync(token);
            if (user == null)
                return BadRequest(new { message = "Invalid or expired magic link" });

            var jwtToken = await _jwtTokenService.GenerateTokenAsync(user);
            return Ok(new { token = jwtToken });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to process magic link. Please try again." });
        }
    }
}