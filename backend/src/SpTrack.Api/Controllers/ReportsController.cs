using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SpTrack.Application.Interfaces;
using SpTrack.Api.Models;
using System.Text;
using System.Text.Json;

namespace SpTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ISpTrackDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ReportsController(ISpTrackDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("issues")]
    public async Task<IActionResult> GetIssuesReport([FromQuery] ReportFiltersRequest request)
    {
        var query = _context.Tickets
            .Include(t => t.Reporter)
            .Include(t => t.Assignee)
            .Include(t => t.Category)
            .Include(t => t.Product)
            .Include(t => t.Project)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(request.Status))
            query = query.Where(t => t.Status.ToString() == request.Status);

        if (!string.IsNullOrEmpty(request.Priority))
            query = query.Where(t => t.Priority.ToString() == request.Priority);

        if (!string.IsNullOrEmpty(request.AssignedTo))
            query = query.Where(t => t.Assignee != null && 
                (t.Assignee.Name.Contains(request.AssignedTo) || t.Assignee.Email!.Contains(request.AssignedTo)));

        if (request.DateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= request.DateFrom);

        if (request.DateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= request.DateTo);

        // Tenant filtering removed

        if (!string.IsNullOrEmpty(request.Project))
            query = query.Where(t => t.Project.Name.Contains(request.Project));

        if (!string.IsNullOrEmpty(request.Category))
            query = query.Where(t => t.Category != null && t.Category.Name.Contains(request.Category));

        var tickets = await query
            .Select(t => new
            {
                Key = t.Key,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                Severity = t.Severity.ToString(),
                Category = t.Category != null ? t.Category.Name : null,
                Product = t.Product != null ? t.Product.Name : null,
                Project = t.Project.Name,
                ReporterName = t.Reporter.Name,
                ReporterEmail = t.Reporter.Email,
                AssigneeName = t.Assignee != null ? t.Assignee.Name : null,
                AssigneeEmail = t.Assignee != null ? t.Assignee.Email : null,
                Source = t.Source.ToString(),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                ClosedAt = t.ClosedAt
            })
            .ToListAsync();

        if (request.Format?.ToLower() == "csv")
        {
            var csv = GenerateCsv(tickets);
            return File(Encoding.UTF8.GetBytes(csv), "text/csv", "issues-report.csv");
        }

        return Ok(tickets);
    }

    private string GenerateCsv(IEnumerable<object> data)
    {
        var sb = new StringBuilder();
        
        // Headers
        sb.AppendLine("Key,Title,Description,Status,Priority,Severity,Category,Product,Project,Reporter Name,Reporter Email,Assignee Name,Assignee Email,Source,Created At,Updated At,Closed At");
        
        // Data rows
        foreach (dynamic item in data)
        {
            sb.AppendLine($"\"{item.Key}\",\"{EscapeCsv(item.Title)}\",\"{EscapeCsv(item.Description)}\",\"{item.Status}\",\"{item.Priority}\",\"{item.Severity}\",\"{item.Category}\",\"{item.Product}\",\"{item.Project}\",\"{item.ReporterName}\",\"{item.ReporterEmail}\",\"{item.AssigneeName}\",\"{item.AssigneeEmail}\",\"{item.Source}\",\"{item.CreatedAt:yyyy-MM-dd HH:mm:ss}\",\"{item.UpdatedAt:yyyy-MM-dd HH:mm:ss}\",\"{item.ClosedAt:yyyy-MM-dd HH:mm:ss}\"");
        }
        
        return sb.ToString();
    }

    private string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return "";
        
        return value.Replace("\"", "\"\"");
    }
}