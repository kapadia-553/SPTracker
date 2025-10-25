# SP Track - Functional Specification Document

**Version:** 1.0
**Last Updated:** October 5, 2025
**Project:** Support Ticket Tracking System
**License:** MIT
**Copyright:** SP Solutions, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Core Features](#core-features)
4. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
5. [Authentication & Authorization](#authentication--authorization)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Email Integration](#email-integration)
8. [File Storage & Security](#file-storage--security)
9. [SLA Management](#sla-management)
10. [Frontend Applications](#frontend-applications)
11. [Background Jobs](#background-jobs)
12. [Reporting](#reporting)
13. [API Endpoints](#api-endpoints)
14. [Database Schema](#database-schema)
15. [Deployment Architecture](#deployment-architecture)
16. [Known Limitations](#known-limitations)
17. [Security Considerations](#security-considerations)
18. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**SP Track** is a comprehensive, multi-tenant support ticket tracking system designed for organizations managing customer support operations. The system enables internal teams (agents) to efficiently handle support requests while providing customers with a self-service portal to create and track their tickets.

### Key Capabilities

- **Multi-tenant Architecture**: Isolated data per organization with shared infrastructure
- **Dual Authentication**: JWT for agents/admins, Magic Links for customers
- **Email-to-Ticket**: Automatic ticket creation from inbound emails
- **SLA Management**: Automated SLA tracking with business hours support
- **File Attachments**: S3-compatible storage with virus scanning (ClamAV)
- **Role-Based Access Control**: Admin, Agent, and Customer roles
- **Real-time Updates**: Hangfire-based background job processing
- **Reporting**: CSV export capabilities for ticket analytics

---

## System Architecture

### Technology Stack

**Backend:**
- **Framework**: ASP.NET Core 8.0 (C#)
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, API layers)
- **Database**: PostgreSQL 16
- **ORM**: Entity Framework Core
- **Authentication**: JWT Bearer Tokens
- **Background Jobs**: Hangfire
- **Validation**: FluentValidation
- **Mapping**: AutoMapper
- **Logging**: Serilog

**Frontend:**
- **Framework**: Angular 18
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Build Tool**: Angular CLI

**Infrastructure:**
- **Containerization**: Docker & Docker Compose
- **Cache/Queue**: Redis
- **File Storage**: MinIO (S3-compatible)
- **Virus Scanning**: ClamAV
- **Reverse Proxy**: Nginx
- **Email**: IMAP (inbound) + SMTP (outbound) - Office 365 compatible

### Application Layers

```
┌─────────────────────────────────────────┐
│          Presentation Layer             │
│  ┌──────────────┐   ┌───────────────┐  │
│  │ Agent Portal │   │Customer Portal│  │
│  │  (Port 8080) │   │  (Port 8081)  │  │
│  └──────────────┘   └───────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           API Layer (Port 5000)         │
│  - Controllers                          │
│  - JWT Authentication                   │
│  - Authorization Filters                │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Application Layer              │
│  - Commands (CQRS)                      │
│  - DTOs                                 │
│  - Interfaces                           │
│  - Validation Rules                     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│  - Entities                             │
│  - Enums                                │
│  - Business Rules                       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        Infrastructure Layer             │
│  - Database Context (EF Core)           │
│  - Repositories                         │
│  - External Services (Email, S3, etc)   │
└─────────────────────────────────────────┘
```

---

## Core Features

### 1. Ticket Management

**Ticket Properties:**
- **Unique Key**: Auto-generated (e.g., PROJ-0001)
- **Title & Description**: Rich text support
- **Priority**: P1 (Critical), P2 (High), P3 (Normal), P4 (Low)
- **Severity**: Critical, High, Medium, Low
- **Status**: New, Triaged, InProgress, WaitingCustomer, Resolved, Closed, Cancelled
- **Source**: Web, Email, API
- **Category & Product**: Organizational tags
- **Custom Fields**: Tenant-specific metadata

**Ticket Lifecycle:**
1. **Creation**: Via web portal, email, or API
2. **Triage**: Assigned to appropriate agent
3. **Work**: Comments, worklogs, status updates
4. **Resolution**: Marked as resolved
5. **Closure**: Final closure after customer confirmation

**Key Capabilities:**
- Comment threads (public and internal)
- File attachments with virus scanning
- Work logs for time tracking
- SLA target tracking
- Audit trail

### 2. Project Management

- Projects group related tickets
- Unique project keys (e.g., SUPPORT, BILLING)
- Multi-project support per tenant
- Project-specific configuration

### 3. Categories & Products

- **Categories**: Support, Billing, Technical, Sales, etc.
- **Products**: Software modules, services, or product lines
- Used for routing and reporting

---

## Multi-Tenancy Implementation

### Tenant Isolation Strategy

**Database-Level Isolation:**
- Single database with `TenantId` column on tenant-scoped tables
- Query filters applied at application level
- **Critical**: NO global query filters in DbContext (must be manually enforced)

**Tenant Scoped Entities:**
- Tickets
- Comments
- Attachments
- Worklogs
- SLA Policies
- Custom Fields
- UserRoles (links users to tenants)

**Global Entities:**
- Users (can belong to multiple tenants)
- Projects (currently global, can be scoped in future)

### Tenant Resolution

```csharp
public Guid? TenantId => GetGuidClaim("tenant_id");
```

Tenant ID is embedded in JWT token claims for customer users. Agents and admins operate across tenants.

### Current Limitations

⚠️ **CRITICAL**: Tenant isolation is NOT enforced via global query filters. Each controller action must manually filter by `TenantId`.

**Risk**: Data leakage if developers forget to add tenant filtering in new endpoints.

**Recommendation**: Implement EF Core Global Query Filters:

```csharp
protected override void OnModelCreating(ModelBuilder builder)
{
    builder.Entity<Ticket>().HasQueryFilter(t => t.TenantId == _currentUser.TenantId);
    builder.Entity<Comment>().HasQueryFilter(c => c.TenantId == _currentUser.TenantId);
    // ... for all tenant-scoped entities
}
```

---

## Authentication & Authorization

### Authentication Methods

#### 1. JWT Bearer Tokens (Agents & Admins)

**Endpoint**: `POST /api/auth/login`

**Request:**
```json
{
  "email": "agent@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "guid",
    "email": "agent@example.com",
    "name": "John Doe",
    "roles": ["Agent"]
  }
}
```

**Token Claims:**
- `sub`: User ID
- `email`: User email
- `name`: Display name
- `role`: User roles (Admin, Agent, CustomerUser)
- `tenant_id`: Tenant ID (for customers only)
- `is_internal`: Boolean flag

**Token Expiration**: 7 days (configurable)

#### 2. Magic Links (Passwordless - Customers)

**Flow:**

1. **Request Magic Link**
   `POST /api/auth/magic-link` or `/api/auth/internal-magic-link`

   ```json
   {
     "email": "customer@example.com"
   }
   ```

2. **Email Sent** with link:
   `http://portal-url/auth/magic-link/consume?token=xyz123`

3. **Consume Token**
   `GET /api/auth/magic-link/consume?token=xyz123`

   Returns JWT token

4. **Frontend stores JWT** and redirects to dashboard

**Magic Link Token:**
- Stored in `MagicLinkTokens` table
- Expires in 15 minutes
- One-time use (deleted on consumption)
- Bound to user email

### Authorization Configuration

**Global Policy:**
- **FallbackPolicy**: `null` (allows anonymous by default)
- Controllers must explicitly use `[Authorize]` attribute
- Public endpoints use `[AllowAnonymous]`

**Protected Endpoints:**
- All `/api/admin/*` endpoints
- All `/api/tickets/*` endpoints
- All `/api/reports/*` endpoints

**Public Endpoints:**
- `/api/auth/login`
- `/api/auth/magic-link`
- `/api/auth/internal-magic-link`
- `/api/auth/magic-link/consume`
- `/api/health`

**JWT Configuration** (Program.cs:88-118):
```csharp
ValidateIssuer = true,
ValidateAudience = true,
ValidateLifetime = true,
ValidateIssuerSigningKey = true,
ClockSkew = TimeSpan.Zero,
NameClaimType = "sub",
RoleClaimType = "role"
```

---

## User Roles & Permissions

### Role Definitions

#### 1. Admin
- **Scope**: Platform-wide access
- **Capabilities**:
  - Manage all tenants
  - Create/edit/delete tenants
  - Manage all users
  - View all tickets across all tenants
  - Access Hangfire dashboard
  - Seed data
  - System configuration

#### 2. Agent
- **Scope**: Internal staff, can be assigned to tenants
- **Capabilities**:
  - View tickets assigned to them
  - View tickets they created
  - Update ticket status, priority, severity
  - Assign tickets to themselves or other agents
  - Add public and internal comments
  - Upload attachments
  - Log work hours
  - Generate reports (filtered to their tickets)

**Restrictions**:
- Cannot view "all" tickets (only assigned/created)
- Cannot update tickets not assigned to them

#### 3. CustomerUser
- **Scope**: Tenant-specific
- **Capabilities**:
  - Create tickets
  - View their own tickets only
  - Add public comments
  - Upload attachments
  - View ticket history

**Restrictions**:
- Cannot see other customers' tickets
- Cannot assign tickets
- Cannot change priority/severity
- Cannot add internal comments
- Cannot access reports

### Permission Matrix

| Feature | Admin | Agent | Customer |
|---------|-------|-------|----------|
| Create Ticket | ✅ | ✅ | ✅ |
| View All Tickets | ✅ | ❌ | ❌ |
| View Assigned Tickets | ✅ | ✅ | ❌ |
| View Own Tickets | ✅ | ✅ | ✅ |
| Update Ticket Status | ✅ | ✅ (assigned) | ❌ |
| Assign Tickets | ✅ | ✅ | ❌ |
| Change Priority/Severity | ✅ | ✅ (assigned) | ❌ |
| Add Public Comments | ✅ | ✅ | ✅ |
| Add Internal Comments | ✅ | ✅ | ❌ |
| Upload Attachments | ✅ | ✅ | ✅ |
| Log Work Hours | ✅ | ✅ (assigned) | ❌ |
| Generate Reports | ✅ | ✅ | ❌ |
| Manage Tenants | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Manage SLA Policies | ✅ | ❌ | ❌ |

### Role Assignment

**UserRole Entity:**
```csharp
public class UserRole
{
    public Guid UserId { get; set; }
    public Guid? TenantId { get; set; }  // Null for Admins
    public string Role { get; set; }      // "Admin", "Agent", "CustomerUser"
    public DateTime CreatedAt { get; set; }
}
```

**Notes:**
- Users can have multiple roles
- Admins have null `TenantId` (global access)
- Agents and Customers are tenant-scoped
- Composite key: (UserId, Role)

---

## Email Integration

### Inbound Email Processing (IMAP)

**Configuration:**
```yaml
IMAP__HOST: outlook.office365.com
IMAP__PORT: 993
IMAP__USER: support@company.com
IMAP__PASS: app_password
```

**Processing Logic** (EmailJobService.cs):

1. **Connect to IMAP** mailbox every N minutes (scheduled by worker)
2. **Fetch unread messages**
3. **Parse subject line** for ticket key pattern: `[PROJ-1234]`
   - **If match found**: Add comment to existing ticket
   - **If no match**: Create new ticket from email

**New Ticket Creation:**
- **Subject** → Ticket Title
- **Body** → Ticket Description
- **Sender** → Matched to User by email
- **Tenant** → Determined from User's tenant assignment
- **Status** → New
- **Priority** → P3 (Normal)
- **Source** → Email

**Comment Creation:**
- **Body** → Comment text
- **Author** → Matched User
- **IsInternal** → false

**Current Limitations:**
- ❌ No attachment extraction from emails
- ❌ No HTML email rendering (plain text only)
- ❌ No email threading/conversation tracking
- ❌ No spam filtering
- ⚠️ Requires user to exist in system (orphan emails ignored)

### Outbound Email Notifications (SMTP)

**Configuration:**
```yaml
SMTP__HOST: smtp.office365.com
SMTP__PORT: 587
SMTP__USER: noreply@company.com
SMTP__PASS: app_password
SMTP__FROM: noreply@company.com
```

**Notification Types:**

1. **Ticket Assigned** (Implemented)
   - Sent to: Assignee
   - Template: HTML with ticket details, priority badge
   - Includes: Link to ticket in agent portal

2. **Ticket Created** (Stub)
   - Sent to: Reporter
   - Status: Not fully implemented

3. **Ticket Updated** (Stub)
   - Sent to: Reporter, Assignee
   - Status: Not fully implemented

4. **Test Email** (Implemented)
   - Validates SMTP configuration
   - Sent via: `/api/test/send-email`

**Email Features:**
- HTML templates with inline CSS
- Responsive design
- Priority-based color coding
- Automatic sender name: "SP Track Support"

**Current Limitations:**
- ⚠️ Certificate validation disabled (`ServerCertificateValidationCallback = true`)
- ❌ No email templates engine (hardcoded HTML)
- ❌ No email queueing/retry logic
- ❌ No unsubscribe management

---

## File Storage & Security

### Storage Architecture

**MinIO (S3-Compatible Storage):**
- **Endpoint**: http://minio:9000
- **Console**: http://localhost:9001
- **Bucket**: sptrack-attachments
- **Credentials**: minioadmin / minioadmin (default, should be changed)

**Storage Service** (S3StorageService.cs):
```csharp
public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    Task<string> GetDownloadUrlAsync(string key, TimeSpan expiration);
    Task DeleteFileAsync(string key);
}
```

**File Upload Flow:**

1. **Upload Request** to `/api/tickets/{key}/attachments`
2. **Virus Scan** (queued asynchronously)
3. **Upload to MinIO** with unique key: `{guid}/{filename}`
4. **Create Attachment Record** in database
5. **Link to Ticket** and optionally to Comment

### Virus Scanning (ClamAV)

**Configuration:**
```yaml
CLAMAV__HOST: clamav
CLAMAV__PORT: 3310
```

**Scanning Process** (FileUploadService.cs:64-69):

```csharp
// Queue virus scan
_ = Task.Run(async () =>
{
    var isClean = await ScanFileAsync(storageKey);
    attachment.AVStatus = isClean ? AVStatus.Clean : AVStatus.Infected;
    await _context.SaveChangesAsync();
});
```

**AVStatus Enum:**
- `Pending`: Uploaded, scan queued
- `Clean`: Passed scan
- `Infected`: Failed scan

**Current Implementation:**

⚠️ **CRITICAL LIMITATION**: The `ScanFileAsync` method currently only sends a PING to ClamAV and returns `true` (assumes clean). **Actual file scanning is NOT implemented**.

**Current Code** (FileUploadService.cs:74-107):
```csharp
public async Task<bool> ScanFileAsync(string storageKey)
{
    try
    {
        using var client = new TcpClient();
        await client.ConnectAsync(clamAvHost!, clamAvPort);

        using var stream = client.GetStream();

        // Send PING command
        var pingCommand = Encoding.ASCII.GetBytes("zPING\0");
        await stream.WriteAsync(pingCommand);

        var buffer = new byte[1024];
        var bytesRead = await stream.ReadAsync(buffer);
        var response = Encoding.ASCII.GetString(buffer, 0, bytesRead);

        if (response.Contains("PONG"))
        {
            _logger.LogInformation("ClamAV scan completed for file: {StorageKey}", storageKey);
            return true; // Simplified - assume clean for demo
        }

        return false;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to scan file: {StorageKey}", storageKey);
        return false;
    }
}
```

**Required Implementation:**
```csharp
// 1. Download file from MinIO
// 2. Stream file to ClamAV via INSTREAM command
// 3. Parse response: "OK" = clean, "FOUND" = infected
// 4. Return scan result
```

**File Size/Type Restrictions:**
- ❌ No file size limits enforced
- ❌ No file type validation
- ❌ No max attachments per ticket

---

## SLA Management

### SLA Policies

**Entity Structure** (SlaPolicy.cs):
```csharp
public class SlaPolicy
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; }
    public string AppliesToJson { get; set; }  // Conditions
    public int FirstResponseMins { get; set; }
    public int ResolveMins { get; set; }
    public bool PauseOnWaitingCustomer { get; set; } = true;
    public bool Active { get; set; } = true;
}
```

**Policy Matching:**
- JSON-based conditions: `{"Priority": ["P1", "P2"]}`
- First matching policy applied
- Fallback to default policy if no match

### SLA Targets

**Entity Structure** (SlaTarget.cs):
```csharp
public class SlaTarget
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid SlaPolicyId { get; set; }
    public DateTime? FirstResponseDueAt { get; set; }
    public DateTime? ResolveDueAt { get; set; }
    public bool FirstResponseMet { get; set; }
    public bool ResolveMet { get; set; }
    public DateTime? PausedAt { get; set; }
}
```

**SLA Calculation:**

1. **Ticket Created** → Find applicable SLA policy
2. **Calculate Deadlines**:
   - **P1 (Critical)**: 24x7 calendar time
   - **P2-P4**: Business hours only (9am-6pm, Mon-Fri)
3. **Create SLA Target** record

**Business Hours Calculation** (Simplified):
- Currently uses simplified math: 9-hour business day
- Does NOT account for holidays
- Does NOT use tenant timezone
- Does NOT use tenant business hours configuration

**SLA Pause/Resume:**
- **Pauses** when ticket status = `WaitingCustomer`
- **Resumes** when status changes
- Deadlines extended by pause duration

### SLA Monitoring

**Background Jobs** (SlaJobService.cs):

1. **CheckSlaBreachesAsync**:
   - Runs every 5 minutes
   - Finds targets past due
   - Logs warnings
   - (Email notifications not implemented)

2. **SendSlaWarningsAsync**:
   - Runs every 5 minutes
   - Finds targets due within 1 hour
   - Logs warnings
   - (Email notifications not implemented)

**Current Limitations:**
- ❌ No SLA breach notifications
- ❌ No escalation workflows
- ⚠️ Business hours calculation is oversimplified
- ❌ No SLA reports/dashboards
- ❌ No SLA performance metrics

---

## Frontend Applications

### 1. Agent Portal (Port 8080)

**Routes** (app-routing.module.ts):

| Route | Component | Access | Purpose |
|-------|-----------|--------|---------|
| `/login` | LoginComponent | Public | Login page |
| `/auth/magic-link/consume` | LoginComponent | Public | Magic link consumption |
| `/` | DashboardComponent | Protected | Dashboard home |
| `/dashboard` | DashboardComponent | Protected | Dashboard |
| `/tickets` | TicketListComponent | Protected | All tickets list |
| `/tickets/new` | CreateTicketComponent | Protected | Create new ticket |
| `/tickets/my` | TicketListComponent | Protected | My assigned tickets |
| `/tickets/unassigned` | TicketListComponent | Protected | Unassigned tickets |
| `/tickets/overdue` | TicketListComponent | Protected | Overdue tickets |
| `/tickets/:key` | TicketDetailComponent | Protected | View/edit ticket |
| `/admin` | AdminComponent | Protected | Admin panel |
| `/reports` | ReportsComponent | Protected | Reports page |

**Key Features:**
- Sidebar navigation
- Ticket filtering (my, unassigned, overdue, all)
- Ticket creation with full metadata
- Comment threads (public & internal toggle)
- File attachments
- Work log tracking
- Admin panel for tenant/user management

**Authentication:**
- JWT stored in localStorage
- AuthGuard protects all routes except `/login`
- HTTP Interceptor adds `Authorization: Bearer {token}` header

### 2. Customer Portal (Port 8081)

**Routes:**

| Route | Component | Access | Purpose |
|-------|-----------|--------|---------|
| `/login` | LoginComponent | Public | Magic link request |
| `/auth/magic-link/consume` | LoginComponent | Public | Token consumption |
| `/` | TicketListComponent | Protected | Redirects to /tickets |
| `/tickets` | TicketListComponent | Protected | My tickets |
| `/tickets/new` | CreateTicketComponent | Protected | Create ticket |
| `/tickets/:key` | TicketDetailComponent | Protected | View ticket |

**Key Differences from Agent Portal:**
- ❌ No Admin panel
- ❌ No Reports page
- ❌ No Dashboard (direct to tickets)
- ❌ No internal comments
- ❌ No ticket assignment
- ❌ No priority/severity changes
- ✅ Simplified UI focused on customer needs

**Authentication:**
- Magic link only (no password login)
- Tenant isolation enforced by backend

---

## Background Jobs

### Hangfire Configuration

**Job Storage**: PostgreSQL (shared with main database)

**Dashboard**: http://localhost:5000/hangfire

⚠️ **Security Warning**: Dashboard uses `AllowAllDashboardAuthorizationFilter` - NO authentication required!

**Architecture:**

- **API Container**: Registers Hangfire client (for queueing jobs)
- **Worker Container**: Runs Hangfire server (processes jobs)

This separation prevents job processing from blocking API requests.

### Scheduled Jobs

#### 1. Worker Heartbeat
- **Schedule**: Every 1 minute (`*/1 * * * *`)
- **Job**: `Console.WriteLine("worker alive....")`
- **Purpose**: Health check

#### 2. SLA Monitoring (Planned)
- **Schedule**: Every 5 minutes
- **Jobs**:
  - `CheckSlaBreachesAsync()`
  - `SendSlaWarningsAsync()`
- **Status**: Partially implemented (no notifications)

#### 3. Email Ingest (Planned)
- **Schedule**: Every N minutes (not currently scheduled)
- **Job**: `ProcessInboundEmailsAsync()`
- **Status**: Service implemented, not scheduled

### On-Demand Jobs

**Ticket Assignment Notification:**
```csharp
BackgroundJob.Enqueue<IEmailJobService>(x =>
    x.SendTicketNotificationAsync(ticketId, "assigned"));
```

Triggered when a ticket is assigned to an agent.

### Current Limitations

- ❌ No recurring job for email ingest
- ❌ No job retry policies
- ❌ No job monitoring/alerting
- ⚠️ Hangfire dashboard exposed without auth
- ❌ No dead letter queue handling

---

## Reporting

### Available Reports

#### Issues Report

**Endpoint**: `GET /api/reports/issues`

**Query Parameters:**
```
?status=InProgress
&priority=P1
&assignedTo=john
&dateFrom=2025-01-01
&dateTo=2025-12-31
&project=Support
&category=Technical
&format=csv
```

**Filters:**
- Status
- Priority
- Assignee (name or email search)
- Date range (created between)
- Project
- Category

**Output Formats:**

1. **JSON** (default):
```json
[
  {
    "key": "SUPP-0042",
    "title": "Login error",
    "status": "InProgress",
    "priority": "P2",
    "severity": "High",
    "assigneeName": "John Doe",
    "createdAt": "2025-10-01T09:30:00Z"
  }
]
```

2. **CSV** (`?format=csv`):
```csv
Key,Title,Description,Status,Priority,Severity,Category,Product,Project,Reporter Name,Reporter Email,Assignee Name,Assignee Email,Source,Created At,Updated At,Closed At
SUPP-0042,"Login error","User cannot log in",InProgress,P2,High,Technical,Portal,Support,"Jane Smith",jane@example.com,"John Doe",john@company.com,Email,2025-10-01 09:30:00,2025-10-03 14:20:00,
```

**Current Limitations:**
- ❌ No SLA compliance reports
- ❌ No agent performance metrics
- ❌ No trend analysis
- ❌ No scheduled report delivery
- ⚠️ No tenant filtering in reports (potential data leak)
- ❌ No dashboard visualizations

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Email/password login |
| POST | `/api/auth/magic-link` | None | Request magic link (customers) |
| POST | `/api/auth/internal-magic-link` | None | Request magic link (internal) |
| GET | `/api/auth/magic-link/consume?token=xyz` | None | Consume magic link token |

### Tickets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tickets` | JWT | List tickets (filtered by role) |
| GET | `/api/tickets/{key}` | JWT | Get ticket details |
| POST | `/api/tickets` | JWT | Create ticket |
| PUT | `/api/tickets/{key}` | JWT | Update ticket |
| DELETE | `/api/tickets/{id}` | JWT | Delete ticket |

**Query Parameters for GET /api/tickets:**
- `filterType`: my, unassigned, overdue, all (admins only)
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 50)

### Comments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/tickets/{key}/comments` | JWT | Add comment |

**Request Body:**
```json
{
  "body": "Comment text",
  "isInternal": false
}
```

### Worklogs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/tickets/{key}/worklogs` | JWT | Log work time |

**Request Body:**
```json
{
  "description": "Fixed login bug",
  "hoursSpent": 2.5
}
```

### Attachments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/tickets/{key}/attachments` | JWT | Upload file |

**Content-Type**: `multipart/form-data`

**Form Fields:**
- `file`: File upload
- `commentId`: (optional) Link to comment

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/tenants` | JWT (Admin) | List tenants |
| POST | `/api/admin/tenants` | JWT (Admin) | Create tenant |
| GET | `/api/admin/users` | JWT (Admin) | List users |
| POST | `/api/admin/users` | JWT (Admin) | Create user |
| POST | `/api/admin/seed` | JWT (Admin) | Seed demo data |

### Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/issues` | JWT | Generate issues report |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | API health check |

### Public Data

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/publicdata/projects` | None | List projects |
| GET | `/api/publicdata/categories` | None | List categories |
| GET | `/api/publicdata/products` | None | List products |

---

## Database Schema

### Core Entities

**Users** (ASP.NET Identity)
```
Id: Guid (PK)
UserName: string
Email: string
Name: string
IsInternal: bool
Active: bool
TenantId: Guid? (nullable - for multi-tenant support)
CreatedAt: DateTime
UpdatedAt: DateTime
```

**UserRoles**
```
UserId: Guid (PK, FK → Users)
TenantId: Guid? (nullable)
Role: string (PK)  -- "Admin", "Agent", "CustomerUser"
CreatedAt: DateTime
```

**Tenants**
```
Id: Guid (PK)
Name: string
Slug: string (unique)
Timezone: string
BusinessHoursJson: string (JSON)
LogoUrl: string?
Active: bool
CreatedAt: DateTime
UpdatedAt: DateTime
```

**Projects**
```
Id: Guid (PK)
Name: string
Key: string (unique) -- e.g., "SUPP"
Description: string
Active: bool
CreatedAt: DateTime
```

**Tickets**
```
Id: Guid (PK)
TenantId: Guid (FK → Tenants)
ProjectId: Guid (FK → Projects)
Key: string (unique) -- e.g., "SUPP-0042"
Title: string
Description: string
Priority: int (enum)
Status: int (enum)
Severity: int (enum)
CategoryId: Guid? (FK → Categories)
ProductId: Guid? (FK → Products)
ReporterId: Guid (FK → Users)
AssigneeId: Guid? (FK → Users)
Source: int (enum)
CreatedAt: DateTime
UpdatedAt: DateTime
ClosedAt: DateTime?
```

**Indexes:**
- `Key` (unique)
- `Status`
- `Priority`
- `AssigneeId`

**Comments**
```
Id: Guid (PK)
TenantId: Guid (FK → Tenants)
TicketId: Guid (FK → Tickets)
AuthorId: Guid (FK → Users)
Body: string
IsInternal: bool
CreatedAt: DateTime
```

**Attachments**
```
Id: Guid (PK)
TicketId: Guid (FK → Tickets)
CommentId: Guid? (FK → Comments)
FileName: string
ContentType: string
Size: long
StorageKey: string -- MinIO object key
AVStatus: int (enum) -- Pending, Clean, Infected
UploadedById: Guid (FK → Users)
CreatedAt: DateTime
```

**Worklogs**
```
Id: Guid (PK)
TenantId: Guid (FK → Tenants)
TicketId: Guid (FK → Tickets)
UserId: Guid (FK → Users)
Description: string
HoursSpent: decimal
CreatedAt: DateTime
```

**SlaPolicy**
```
Id: Guid (PK)
TenantId: Guid (FK → Tenants)
Name: string
AppliesToJson: string (JSON conditions)
FirstResponseMins: int
ResolveMins: int
PauseOnWaitingCustomer: bool
Active: bool
CreatedAt: DateTime
```

**SlaTarget**
```
Id: Guid (PK)
TicketId: Guid (FK → Tickets)
SlaPolicyId: Guid (FK → SlaPolicy)
FirstResponseDueAt: DateTime?
ResolveDueAt: DateTime?
FirstResponseMet: bool
ResolveMet: bool
PausedAt: DateTime?
CreatedAt: DateTime
UpdatedAt: DateTime
```

**TicketCustomField**
```
Id: Guid (PK)
TenantId: Guid (FK → Tenants)
Name: string
Type: string -- "text", "number", "select", "date"
OptionsJson: string (JSON array for select)
Required: bool
Scope: string -- "ticket", "project"
CreatedAt: DateTime
```

**TicketCustomValue**
```
TicketId: Guid (PK, FK → Tickets)
FieldId: Guid (PK, FK → TicketCustomField)
Value: string
```

**MagicLinkToken**
```
Id: Guid (PK)
Token: string (unique)
Email: string
ExpiresAt: DateTime
ConsumedAt: DateTime?
CreatedAt: DateTime
```

**AuditLog** (Planned, structure defined but not actively used)
```
Id: Guid (PK)
TenantId: Guid? (FK → Tenants)
UserId: Guid? (FK → Users)
Action: string
EntityType: string
EntityId: Guid?
Changes: string (JSON)
Timestamp: DateTime
```

---

## Deployment Architecture

### Docker Compose Services

```yaml
services:
  # Databases
  postgres:      # PostgreSQL 16 - Port 5432
  redis:         # Redis 7 - Port 6379

  # Storage & Security
  minio:         # MinIO - Ports 9000, 9001
  clamav:        # ClamAV - Port 3310

  # Application
  api:           # ASP.NET Core API - Port 5000
  worker:        # Hangfire Worker (no exposed port)
  agent:         # Angular Agent Portal - Port 8080
  portal:        # Angular Customer Portal - Port 8081

  # Infrastructure
  nginx:         # Nginx Reverse Proxy - Port 80
```

### Port Mapping

| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| API | 8080 | 5000 | http://localhost:5000 |
| Agent Portal | 80 | 8080 | http://localhost:8080 |
| Customer Portal | 80 | 8081 | http://localhost:8081 |
| Postgres | 5432 | 5432 | localhost:5432 |
| Redis | 6379 | 6379 | localhost:6379 |
| MinIO API | 9000 | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | 9001 | http://localhost:9001 |
| ClamAV | 3310 | 3310 | localhost:3310 |
| Nginx | 80 | 80 | http://localhost |
| Hangfire | - | 5000/hangfire | http://localhost:5000/hangfire |

### Nginx Routing

```
http://localhost/api/*    → api:8080
http://localhost/agent/*  → agent:80
http://localhost/portal/* → portal:80
http://localhost/         → agent:80 (default)
```

### Environment Configuration

**.env File**:
```bash
# Database
DB__CONNECTION_STRING=Host=postgres;Database=sptrack;Username=postgres;Password=postgres

# JWT
JWT__ISSUER=SP-Track
JWT__AUDIENCE=SP-Track-Users
JWT__KEY=<32+ character random string>

# SMTP
SMTP__HOST=smtp.office365.com
SMTP__PORT=587
SMTP__USER=your-email@domain.com
SMTP__PASS=app-password
SMTP__FROM=noreply@domain.com

# IMAP
IMAP__HOST=outlook.office365.com
IMAP__PORT=993
IMAP__USER=support@domain.com
IMAP__PASS=app-password

# Storage
STORAGE__S3__ENDPOINT=http://minio:9000
STORAGE__S3__KEY=minioadmin
STORAGE__S3__SECRET=minioadmin
STORAGE__S3__BUCKET=sptrack-attachments

# Application
APP__BASE_URL=http://localhost:5000
TENANT__DEFAULT_TIMEZONE=Asia/Dubai

# Portals
PORTAL__ADMIN_URL=http://localhost:8080
PORTAL__AGENT_URL=http://localhost:8081

# Redis
REDIS__CONNECTION_STRING=redis:6379

# ClamAV
CLAMAV__HOST=clamav
CLAMAV__PORT=3310
```

### Deployment Steps

1. **Clone Repository**
   ```bash
   git clone <repo-url>
   cd SPTracker
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with actual credentials
   ```

3. **Build and Start**
   ```bash
   docker-compose up -d --build
   ```

4. **Wait for Services**
   ```bash
   # API takes ~30s to apply migrations
   docker-compose logs -f api
   ```

5. **Seed Data** (Optional)
   ```bash
   curl -X POST http://localhost:5000/api/admin/seed
   ```

6. **Access Portals**
   - Agent: http://localhost:8080
   - Customer: http://localhost:8081
   - API Docs: http://localhost:5000/swagger

### Health Checks

All services have health checks configured:

- **Postgres**: `pg_isready`
- **Redis**: `redis-cli ping`
- **MinIO**: `curl -f http://localhost:9000/minio/health/live`
- **ClamAV**: `clamdscan --version`

API container waits for database health before starting.

---

## Known Limitations

### Critical Security Issues

1. ⚠️ **Tenant Isolation NOT Enforced by Database**
   - No EF Core global query filters
   - Developers must manually add `TenantId` filters
   - High risk of data leakage

2. ⚠️ **Hangfire Dashboard Publicly Accessible**
   - No authentication required
   - Can view all background jobs
   - Can trigger/delete jobs

3. ⚠️ **Virus Scanning Not Functional**
   - Files marked as "Clean" without actual scanning
   - ClamAV integration incomplete

4. ⚠️ **Certificate Validation Disabled**
   - SMTP client trusts all certificates
   - IMAP client may have same issue

5. ⚠️ **Default Credentials in Code**
   - Hardcoded fallback SMTP credentials (EmailService.cs:56-61)
   - MinIO default credentials (minioadmin/minioadmin)

### Feature Limitations

1. **Email Processing**
   - No attachment extraction from emails
   - No HTML rendering
   - No threading/conversation tracking
   - Orphan emails silently ignored

2. **SLA Management**
   - Business hours calculation oversimplified
   - No holiday support
   - No timezone handling
   - No breach notifications
   - No escalation workflows

3. **Custom Fields**
   - Database entities exist
   - UI not implemented
   - No validation

4. **Reporting**
   - Only one report type
   - No visualizations
   - No scheduled delivery
   - No tenant filtering (data leak risk)

5. **Audit Logging**
   - Entity defined but not used
   - No tracking of changes

6. **File Attachments**
   - No size limits
   - No type restrictions
   - No quota management

7. **Background Jobs**
   - No retry policies
   - No dead letter queue
   - Email ingest not scheduled

### Architectural Limitations

1. **No CQRS Separation**
   - MediatR configured but minimally used
   - Most logic in controllers

2. **No API Versioning**
   - Breaking changes will affect all clients

3. **No Rate Limiting**
   - API can be abused

4. **No Distributed Caching**
   - Redis configured but not used

5. **No Real-time Updates**
   - No WebSockets/SignalR
   - UI requires manual refresh

6. **No Multi-language Support**
   - English only

7. **No Dark Mode**
   - Frontend has light theme only

---

## Security Considerations

### Implemented Security

✅ **Authentication**
- JWT with signature validation
- Token expiration (7 days)
- Magic links with 15-minute expiry
- One-time use tokens

✅ **Authorization**
- Role-based access control
- Attribute-based endpoint protection
- Permission matrix enforced

✅ **Password Security**
- ASP.NET Identity password requirements
- Minimum 8 characters
- Requires digit, lowercase, uppercase

✅ **SQL Injection Protection**
- Entity Framework parameterized queries

✅ **CORS**
- AllowAnyOrigin for development
- Should be restricted in production

✅ **HTTPS**
- StartTls for SMTP
- SSL for IMAP

### Security Gaps

❌ **Tenant Isolation**
- Manual filtering required
- No database-level enforcement

❌ **Secrets Management**
- Credentials in .env file
- No vault integration

❌ **Certificate Validation**
- Disabled for SMTP

❌ **Hangfire Dashboard**
- No authentication

❌ **Virus Scanning**
- Not functional

❌ **Rate Limiting**
- None implemented

❌ **CSRF Protection**
- Not configured

❌ **Content Security Policy**
- Not configured

❌ **API Input Validation**
- Limited FluentValidation usage

### Recommended Security Enhancements

1. **Implement Global Query Filters** for tenant isolation
2. **Secure Hangfire Dashboard** with JWT authentication
3. **Complete ClamAV Integration** for real virus scanning
4. **Enable Certificate Validation** for SMTP/IMAP
5. **Add Rate Limiting** (e.g., AspNetCoreRateLimit)
6. **Implement CSRF Tokens** for form submissions
7. **Add CSP Headers** to prevent XSS
8. **Use Azure Key Vault** or HashiCorp Vault for secrets
9. **Implement Audit Logging** for compliance
10. **Add File Upload Restrictions** (size, type, count)

---

## Future Enhancements

### Short-Term (Phase 2)

1. **Complete Email Integration**
   - Extract attachments from emails
   - HTML email rendering
   - Email threading

2. **Virus Scanning**
   - Implement actual ClamAV file scanning
   - Quarantine infected files
   - Admin notifications

3. **SLA Enhancements**
   - Email breach notifications
   - SLA dashboard/reports
   - Escalation workflows

4. **Custom Fields UI**
   - Admin interface to define fields
   - Ticket form integration
   - Validation rules

5. **Reporting Dashboard**
   - Chart visualizations
   - SLA compliance metrics
   - Agent performance

6. **Audit Logging**
   - Track all entity changes
   - Admin audit viewer

### Mid-Term (Phase 3)

1. **Real-time Updates**
   - SignalR for live ticket updates
   - Notification toasts

2. **Advanced Search**
   - Full-text search (PostgreSQL FTS or Elasticsearch)
   - Saved searches

3. **Knowledge Base**
   - Article management
   - Customer self-service

4. **Canned Responses**
   - Quick reply templates
   - Variables/placeholders

5. **Customer Satisfaction**
   - CSAT surveys
   - NPS tracking

6. **Multi-channel Support**
   - Live chat integration
   - Social media tickets

### Long-Term (Phase 4)

1. **AI/ML Features**
   - Auto-categorization
   - Sentiment analysis
   - Smart suggestions

2. **Mobile Apps**
   - iOS/Android native apps

3. **API Marketplace**
   - Public API
   - Webhooks
   - Zapier integration

4. **Advanced Reporting**
   - BI tool integration
   - Predictive analytics

5. **White-labeling**
   - Custom branding per tenant
   - Domain mapping

---

## Appendix

### Default Seeded Data

**Admin User:**
- Email: `admin@spsolutions.ae`
- Password: `Admin@12345`
- Role: Admin (global)

**Demo Agent:**
- Email: `abdul@spsolutions.org`
- Password: `Agent@12345`
- Role: Agent
- Tenant: Demo Organization

**Demo Customer:**
- Email: `kapadia552@gmail.com`
- Password: `Customer@12345`
- Role: CustomerUser
- Tenant: Demo Organization

**Demo Tenant:**
- Name: Demo Organization
- Slug: demo
- Timezone: Asia/Dubai
- Business Hours: Sunday-Thursday 9am-6pm

### Useful Commands

**Docker:**
```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f api
docker-compose logs -f worker

# Restart service
docker-compose restart api

# Stop all
docker-compose down

# Remove volumes (data loss!)
docker-compose down -v
```

**Database:**
```bash
# Access PostgreSQL
docker exec -it sptracker-postgres-1 psql -U postgres -d sptrack

# Run migrations
docker-compose exec api dotnet ef database update

# Create migration
docker-compose exec api dotnet ef migrations add MigrationName -p src/SpTrack.Infrastructure -s src/SpTrack.Api
```

**Backup:**
```bash
# Database backup
docker exec sptracker-postgres-1 pg_dump -U postgres sptrack > backup.sql

# Restore
docker exec -i sptracker-postgres-1 psql -U postgres sptrack < backup.sql
```

### API Testing (Postman)

Import `scripts/postman-collection.json` for ready-to-use API tests.

**Sample Requests:**

1. **Login**
   ```
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json

   {
     "email": "agent@example.com",
     "password": "Agent@12345"
   }
   ```

2. **List Tickets**
   ```
   GET http://localhost:5000/api/tickets?filterType=my&page=1&pageSize=50
   Authorization: Bearer {token}
   ```

3. **Create Ticket**
   ```
   POST http://localhost:5000/api/tickets
   Authorization: Bearer {token}
   Content-Type: application/json

   {
     "projectId": "guid",
     "title": "Login issue",
     "description": "User cannot log in",
     "priority": 2,
     "severity": 2
   }
   ```

---

## Contact & Support

**Project Repository**: (To be added)
**Issue Tracker**: (To be added)
**Security Reports**: security@spsolutions.ae

---

**Document End**
