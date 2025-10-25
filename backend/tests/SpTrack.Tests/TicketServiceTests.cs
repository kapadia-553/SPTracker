using Xunit;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using SpTrack.Infrastructure.Data;
using SpTrack.Domain.Entities;
using SpTrack.Domain.Enums;
using SpTrack.Application.Commands;
using AutoMapper;
using Moq;
using SpTrack.Application.Interfaces;

namespace SpTrack.Tests;

public class TicketServiceTests : IDisposable
{
    private readonly SpTrackDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly IMapper _mapper;

    public TicketServiceTests()
    {
        var options = new DbContextOptionsBuilder<SpTrackDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new SpTrackDbContext(options);
        _currentUserMock = new Mock<ICurrentUserService>();

        var config = new MapperConfiguration(cfg =>
        {
            // Add your AutoMapper profiles here
        });
        _mapper = config.CreateMapper();

        SeedTestData();
    }

    [Fact]
    public async Task CreateTicket_ShouldCreateTicketWithCorrectTenantId()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        _currentUserMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserMock.Setup(x => x.UserId).Returns(userId);

        var project = new Project
        {
            Id = projectId,
            TenantId = tenantId,
            Key = "TEST",
            Name = "Test Project",
            Description = "Test project",
            Active = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var handler = new CreateTicketHandler(_context, _currentUserMock.Object, _mapper);
        var command = new CreateTicketCommand(
            "Test Ticket",
            "Test Description",
            Priority.P3,
            Severity.Medium,
            projectId,
            null,
            null,
            new Dictionary<string, string>()
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Test Ticket");
        
        var savedTicket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == result.Id);
        savedTicket.Should().NotBeNull();
        savedTicket!.TenantId.Should().Be(tenantId);
    }

    [Fact]
    public async Task CreateTicket_ShouldThrowWhenProjectNotInTenant()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var otherTenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        _currentUserMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserMock.Setup(x => x.UserId).Returns(userId);

        var project = new Project
        {
            Id = projectId,
            TenantId = otherTenantId, // Different tenant
            Key = "TEST",
            Name = "Test Project",
            Description = "Test project",
            Active = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var handler = new CreateTicketHandler(_context, _currentUserMock.Object, _mapper);
        var command = new CreateTicketCommand(
            "Test Ticket",
            "Test Description",
            Priority.P3,
            Severity.Medium,
            projectId,
            null,
            null,
            new Dictionary<string, string>()
        );

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, CancellationToken.None));
    }

    private void SeedTestData()
    {
        // Add any test data seeding here
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}