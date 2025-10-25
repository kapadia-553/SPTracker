# SPTracker - Claude Code Project Context

**Last Updated:** October 5, 2025
**Project Owner:** SP Solutions
**AI Assistant:** Claude Code

---

## Quick Start Instructions

When you wake up and start working on this project, **ALWAYS** follow these steps:

1. **Read this file first** to understand the project context
2. **Read FUNCTIONAL_SPECIFICATION.md** for complete system details
3. **Check WORK_LOG_2025-10-03.md** for recent changes and fixes
4. **Ask the user** what they want to work on today
5. **Update documentation** after making changes (with user approval)

---

## Project Overview

**SPTracker** is a multi-tenant support ticket tracking system with:
- **Backend**: ASP.NET Core 8.0 (Clean Architecture)
- **Frontend**: Angular 18 (2 separate portals)
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker Compose
- **Purpose**: Help organizations manage customer support tickets

---

## Architecture At-a-Glance

```
Project Structure:
├── backend/
│   └── src/
│       ├── SpTrack.Api/          # API Controllers, Services
│       ├── SpTrack.Application/  # Commands, DTOs, Interfaces
│       ├── SpTrack.Domain/       # Entities, Enums
│       ├── SpTrack.Infrastructure/ # Database, External Services
│       └── SpTrack.Worker/       # Background Jobs (Hangfire)
├── frontend/
│   ├── agent/                    # Agent Portal (Port 8080)
│   ├── portal/                   # Customer Portal (Port 8081)
│   └── shared/                   # Shared components
├── infrastructure/
├── nginx/
├── scripts/
├── docker-compose.yml
├── .env
├── FUNCTIONAL_SPECIFICATION.md   # ⭐ YOUR REFERENCE DOCUMENT
└── .claude/
    └── project-context.md        # ⭐ THIS FILE (READ FIRST)
```

---

## Key Concepts

### 1. Multi-Tenancy
- Multiple organizations (tenants) share one database
- Each tenant's data is isolated by `TenantId`
- **CRITICAL**: No global query filters - must manually filter by `TenantId`
- Users can belong to multiple tenants via `UserRoles`

### 2. User Roles
- **Admin**: Platform-wide access, manages all tenants
- **Agent**: Internal staff, sees assigned/created tickets
- **CustomerUser**: Tenant-specific, sees only their own tickets

### 3. Authentication
- **JWT Tokens**: For Admins and Agents (password login)
- **Magic Links**: For Customers (passwordless email links)

### 4. Tickets
- Core entity: `Ticket`
- Unique key format: `{ProjectKey}-{Number}` (e.g., SUPP-0042)
- Status flow: New → Triaged → InProgress → Resolved → Closed
- Priority: P1 (Critical) to P4 (Low)

---

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| api | 5000 | ASP.NET Core API |
| worker | - | Hangfire background jobs |
| agent | 8080 | Angular agent portal |
| portal | 8081 | Angular customer portal |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Cache/Queue (configured but unused) |
| minio | 9000/9001 | S3-compatible file storage |
| clamav | 3310 | Virus scanner (partially implemented) |
| nginx | 80 | Reverse proxy |

**Start All Services:**
```bash
docker-compose up -d --build
```

---

## Common Tasks

### Adding a New Feature

1. **Backend**:
   - Add entity to `SpTrack.Domain/Entities/`
   - Add migration: `dotnet ef migrations add {Name} -p src/SpTrack.Infrastructure -s src/SpTrack.Api`
   - Add controller to `SpTrack.Api/Controllers/`
   - Add DTOs to `SpTrack.Application/DTOs/`
   - Test with Postman

2. **Frontend**:
   - Add component: `ng generate component {name}`
   - Add service: `ng generate service {name}`
   - Update routing in `app-routing.module.ts`

3. **Documentation**:
   - **ASK USER** if you should update `FUNCTIONAL_SPECIFICATION.md`
   - If yes, update relevant sections
   - Add notes to a daily work log (e.g., `WORK_LOG_2025-10-XX.md`)

### Fixing a Bug

1. **Identify** the issue location (controller, service, etc.)
2. **Read related code** using Read tool
3. **Make fix** using Edit tool
4. **Test** the fix
5. **Document** in work log (don't update functional spec for bug fixes unless feature behavior changed)

### Database Changes

```bash
# Create migration
docker-compose exec api dotnet ef migrations add MigrationName -p src/SpTrack.Infrastructure -s src/SpTrack.Api

# Apply migration
docker-compose exec api dotnet ef database update

# Rollback
docker-compose exec api dotnet ef database update PreviousMigrationName
```

### Debugging

```bash
# View API logs
docker-compose logs -f api

# View Worker logs
docker-compose logs -f worker

# Restart service
docker-compose restart api

# Enter database
docker exec -it sptracker-postgres-1 psql -U postgres -d sptrack
```

---

## Critical Security Issues (⚠️ DO NOT INTRODUCE NEW ONES)

1. **Tenant Isolation**: Always filter by `TenantId` manually
2. **Hangfire Dashboard**: Currently public at `/hangfire` (known issue)
3. **Virus Scanning**: ClamAV integration incomplete (files not actually scanned)
4. **Credentials**: Never hardcode credentials (use .env)

---

## Code Patterns to Follow

### 1. Tenant Filtering (ALWAYS DO THIS)

```csharp
// ✅ CORRECT
var tickets = await _context.Tickets
    .Where(t => t.TenantId == _currentUser.TenantId)
    .ToListAsync();

// ❌ WRONG - will expose all tenants' data
var tickets = await _context.Tickets.ToListAsync();
```

### 2. Authorization

```csharp
// Controller level
[ApiController]
[Route("api/[controller]")]
[Authorize]  // ← Always add this for protected endpoints
public class TicketsController : ControllerBase

// Public endpoints
[HttpPost("login")]
[AllowAnonymous]  // ← Only for auth endpoints
public async Task<IActionResult> Login(...)
```

### 3. Role Checks

```csharp
var isAdmin = _currentUser.Roles.Contains("Admin");
var isAgent = _currentUser.Roles.Contains("Agent");
var isCustomer = _currentUser.Roles.Contains("CustomerUser");

if (!isAdmin)
{
    // Apply role-based filtering
    query = query.Where(t =>
        t.AssigneeId == _currentUser.UserId ||
        t.ReporterId == _currentUser.UserId);
}
```

---

## Testing Credentials

**Admin:**
- Email: `admin@spsolutions.ae`
- Password: `Admin@12345`

**Agent:**
- Email: `abdul@spsolutions.org`
- Password: `Agent@12345`

**Customer:**
- Email: `kapadia552@gmail.com`
- Password: `Customer@12345`

**Seed Data:**
```bash
curl -X POST http://localhost:5000/api/admin/seed
```

---

## Documentation Update Protocol

### When to Update FUNCTIONAL_SPECIFICATION.md

**YES - Update (with user approval):**
- ✅ New feature added
- ✅ Feature behavior changed significantly
- ✅ New API endpoint added
- ✅ Database schema changed
- ✅ Security issue fixed
- ✅ Deployment process changed

**NO - Don't Update:**
- ❌ Small bug fixes
- ❌ Code refactoring (no behavior change)
- ❌ UI styling tweaks
- ❌ Performance optimizations

### How to Update

1. **Ask user**: "Should I update FUNCTIONAL_SPECIFICATION.md to reflect this change?"
2. **If approved**: Use Edit tool to update specific sections
3. **Update "Last Updated" date** at top of document
4. **Briefly mention** what was updated in chat

### What to Document in Work Logs

Create daily work logs: `WORK_LOG_2025-{MM}-{DD}.md`

Include:
- Date and summary
- Problems identified
- Root causes
- Files modified
- Commands executed
- Testing checklist
- Status (resolved/ongoing)

---

## Important Files Reference

| File | Purpose | When to Read |
|------|---------|--------------|
| `.claude/project-context.md` | This file - your wake-up guide | Every session start |
| `FUNCTIONAL_SPECIFICATION.md` | Complete system documentation | When working on features |
| `WORK_LOG_2025-10-03.md` | Example work log (auth fix) | When debugging similar issues |
| `.env.example` | Environment variables template | When adding config |
| `docker-compose.yml` | Service definitions | When adding services |
| `backend/src/SpTrack.Domain/` | Business entities | When adding models |
| `backend/src/SpTrack.Api/Controllers/` | API endpoints | When adding endpoints |

---

## Common Questions & Answers

### Q: How do I find where a feature is implemented?

**A: Use Grep tool**
```bash
# Find by keyword
Grep pattern="TicketStatus" path="backend/src"

# Find in controllers
Grep pattern="CreateTicket" path="backend/src/SpTrack.Api/Controllers"
```

### Q: How do I test an API endpoint?

**A: Use Postman or curl**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@spsolutions.ae","password":"Admin@12345"}'

# Use token
curl http://localhost:5000/api/tickets \
  -H "Authorization: Bearer {token}"
```

### Q: How do I check if code is working?

**A: Check logs**
```bash
docker-compose logs -f api | grep ERROR
docker-compose logs --tail 100 api
```

### Q: Where do I add a new API endpoint?

**A: Controllers folder**
1. Add method to existing controller in `backend/src/SpTrack.Api/Controllers/`
2. Or create new controller
3. Add `[HttpGet]`, `[HttpPost]`, etc. attributes
4. Add `[Authorize]` or `[AllowAnonymous]`

---

## Your Working Style

When the user asks you to work on this project:

1. **Understand the request** - Ask clarifying questions if needed
2. **Check current implementation** - Read relevant files first
3. **Plan your approach** - Use TodoWrite for complex tasks
4. **Make changes** - Use Edit/Write tools
5. **Test mentally** - Think through the logic
6. **Suggest testing** - Recommend how user should test
7. **Ask about docs** - "Should I update FUNCTIONAL_SPECIFICATION.md?"
8. **Create work log** - For significant changes, create/update work log

---

## Red Flags (Things to Avoid)

🚫 **Never do these without explicit user approval:**
- Deleting files
- Dropping database tables
- Changing authentication logic
- Modifying docker-compose.yml services
- Updating production environment variables
- Force-pushing to git

⚠️ **Always be careful with:**
- Tenant isolation (always filter by TenantId)
- Authorization logic (verify roles properly)
- Database migrations (can't be easily undone)
- Breaking API changes (will break frontend)

---

## Quick Reference: Entity Relationships

```
Tenant
  ├── UserRoles (many)
  ├── Tickets (many)
  ├── SlaPolicies (many)
  └── CustomFields (many)

User
  ├── UserRoles (many)
  ├── ReportedTickets (many)
  ├── AssignedTickets (many)
  ├── Comments (many)
  └── Worklogs (many)

Ticket
  ├── Tenant (one)
  ├── Project (one)
  ├── Reporter (User, one)
  ├── Assignee (User, one, optional)
  ├── Category (one, optional)
  ├── Product (one, optional)
  ├── Comments (many)
  ├── Attachments (many)
  ├── Worklogs (many)
  ├── CustomValues (many)
  └── SlaTarget (one, optional)
```

---

## Remember

- You are helping with a **production support system**
- **Security and data isolation** are critical
- **Always ask** before making breaking changes
- **Document thoroughly** for future reference
- **Test your changes** mentally before suggesting
- **Be proactive** but not presumptuous

---

## Next Steps on Wake Up

1. ✅ Read this file (you're doing it now!)
2. ⏭️ Ask user: "What would you like to work on today?"
3. 📖 Read FUNCTIONAL_SPECIFICATION.md sections relevant to the task
4. 🔍 Search for related code using Grep/Read tools
5. 💪 Start working!

---

**End of Context File**

*This file should be updated if major project structure changes occur*
