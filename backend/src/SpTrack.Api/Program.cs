using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Serilog;
using SpTrack.Api.HangfireAuth;  // at top
using SpTrack.Api.Services;
using SpTrack.Application.Interfaces;
using SpTrack.Domain.Entities;
using SpTrack.Infrastructure.Data;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

var conn = builder.Configuration.GetConnectionString("DefaultConnection")
          ?? builder.Configuration["DB__CONNECTION_STRING"]
          ?? "Host=postgres;Port=5432;Database=sptrack;Username=postgres;Password=postgres";

// Add services to the container.
//builder.Services.AddDbContext<SpTrackDbContext>(options =>
//    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddDbContext<SpTrackDbContext>(opt =>
    opt.UseNpgsql(conn, x => x.MigrationsAssembly("SpTrack.Infrastructure")));
	
builder.Services.AddScoped<ISpTrackDbContext>(provider => provider.GetService<SpTrackDbContext>()!);

// Configure Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<SpTrackDbContext>()
.AddDefaultTokenProviders();

// Configure JWT
var jwtSettings = builder.Configuration.GetSection("JWT");
var keyValue = jwtSettings["Key"];

// Debug logging for JWT configuration
Console.WriteLine($"🔑 JWT Configuration Debug:");
Console.WriteLine($"   Issuer: {jwtSettings["Issuer"]}");
Console.WriteLine($"   Audience: {jwtSettings["Audience"]}");
Console.WriteLine($"   Key Length: {keyValue?.Length ?? 0}");
Console.WriteLine($"   Key Preview: {(keyValue != null && keyValue.Length >= 20 ? keyValue.Substring(0, 20) : keyValue ?? "NULL")}");
Console.WriteLine($"   Key Full Value: '{keyValue}'");

if (string.IsNullOrEmpty(keyValue))
{
    throw new InvalidOperationException("JWT Key is not configured!");
}

var key = Encoding.UTF8.GetBytes(keyValue);
Console.WriteLine($"   Key Bytes Length: {key.Length}");
var signingKey = new SymmetricSecurityKey(key);
Console.WriteLine($"   Signing Key Created: {signingKey != null}");

// Disable claim type mapping to use short claim names
Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler.DefaultInboundClaimTypeMap.Clear();
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = signingKey,
        ClockSkew = TimeSpan.Zero,
        NameClaimType = "sub",
        RoleClaimType = "role"
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("🚨 JWT Authentication Failed: {Error}", context.Exception.Message);
            logger.LogError("   Token: {Token}", context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Substring(0, Math.Min(50, context.Request.Headers["Authorization"].ToString().Length)));
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("✅ JWT Token Validated Successfully");
            return Task.CompletedTask;
        }
    };
});

// Configure authorization
builder.Services.AddAuthorization(options =>
{
    // Explicitly set FallbackPolicy to null to allow anonymous access by default
    // Controllers and actions must explicitly use [Authorize] to require authentication
    options.FallbackPolicy = null;
});


builder.Services.AddHangfire(cfg => cfg
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(opt => opt.UseNpgsqlConnection(conn)));

// Register IBackgroundJobClient explicitly for job queueing (without running the server)
builder.Services.AddSingleton<IBackgroundJobClient>(serviceProvider =>
    new BackgroundJobClient(serviceProvider.GetRequiredService<JobStorage>()));
/*// Add Hangfire
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfireServer();*/ // Commented out to avoid conflict with Worker project

// Add MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(SpTrack.Application.Commands.CreateTicketCommand).Assembly));

// Add AutoMapper
builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly(), typeof(SpTrack.Application.DTOs.TicketDto).Assembly);

// Add FluentValidation
builder.Services.AddValidatorsFromAssembly(typeof(SpTrack.Application.Commands.CreateTicketCommand).Assembly);

// Add HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// Add custom services
builder.Services.AddScoped<SpTrack.Application.Interfaces.ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IMagicLinkService, MagicLinkService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<SpTrack.Api.Services.XIStorageService, XS3StorageService>();
builder.Services.AddScoped<SpTrack.Worker.Jobs.IEmailJobService, SpTrack.Worker.Jobs.EmailJobService>();
// Use fully qualified name to resolve ambiguity and ensure correct interface is used

// Add controllers
builder.Services.AddControllers(options =>
{
    // Do NOT add global authorization filter
    // Controllers must explicitly use [Authorize] attribute
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
//builder.Services.AddInfrastructure(builder.Configuration);
// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

Console.WriteLine("⚙️ Registering Authentication and Authorization middleware");
app.UseAuthentication();
app.UseAuthorization();
Console.WriteLine("✅ Authentication and Authorization middleware registered");

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new AllowAllDashboardAuthorizationFilter() }
});



app.MapControllers();

// Apply migrations
/*using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SpTrackDbContext>();
    context.Database.Migrate();
}*/
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbStartup");
    var db = scope.ServiceProvider.GetRequiredService<SpTrackDbContext>();

    var csb = new NpgsqlConnectionStringBuilder(db.Database.GetDbConnection().ConnectionString);
    logger.LogInformation("Applying EF migrations to DB '{Db}' on host '{Host}'...", csb.Database, csb.Host);

    var all = db.Database.GetMigrations();
    logger.LogInformation("All migrations discovered: {Count} {List}", all.Count(), string.Join(", ", all));

    var pending = db.Database.GetPendingMigrations();
    logger.LogInformation("Pending migrations: {Count} {List}", pending.Count(), string.Join(", ", pending));

    try
    {
        db.Database.Migrate();
        logger.LogInformation("EF migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "EF migration failed.");
        throw;
    }
}

try
{
    Log.Information("Starting web application");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}