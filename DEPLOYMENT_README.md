# Deployment Files Overview

This document explains the deployment files that have been created for your SP Tracker project.

## Created Files

### 1. `docker-compose.prod.yml`
**Purpose**: Production-ready Docker Compose configuration

**Key Features**:
- Environment-based configuration using `.env` file
- Proper restart policies (`unless-stopped`)
- Internal network isolation
- Health checks for all services
- No exposed database ports (security)
- Production environment settings

**Usage**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

### 2. `.env.production`
**Purpose**: Production environment template

**Contains**:
- Database credentials
- JWT configuration
- MinIO storage settings
- SMTP/IMAP email configuration
- Application URLs
- All sensitive configuration

**How to Use**:
1. Copy to `.env`: `cp .env.production .env`
2. Replace all `CHANGE_ME` values
3. Never commit `.env` to Git (it's in .gitignore)

---

### 3. `scripts/deploy-vps.sh`
**Purpose**: Automated deployment script

**What It Does**:
- ✅ Checks prerequisites (Docker, Docker Compose, Git)
- ✅ Validates environment configuration
- ✅ Creates required directories
- ✅ Optionally generates SSL certificates
- ✅ Builds and starts containers
- ✅ Waits for services to be healthy
- ✅ Initializes MinIO storage
- ✅ Optionally seeds database
- ✅ Displays deployment information

**Usage**:
```bash
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

---

### 4. `nginx/nginx.prod.conf`
**Purpose**: Production Nginx configuration

**Features**:
- ✅ SSL/HTTPS support (ready to enable)
- ✅ Rate limiting for API and login
- ✅ Security headers (XSS, CORS, etc.)
- ✅ Gzip compression
- ✅ Static asset caching
- ✅ WebSocket support
- ✅ Proper proxy headers
- ✅ Health check endpoint
- ⚠️ Hangfire dashboard (needs restriction)

**Configuration Points**:
- Uncomment SSL blocks when ready
- Update `server_name` with your domain
- Restrict Hangfire access by IP if needed

---

### 5. `DEPLOYMENT_GUIDE.md`
**Purpose**: Complete deployment documentation

**Sections**:
1. Prerequisites
2. Pre-deployment preparation
3. VPS setup (Docker, firewall, etc.)
4. Deployment methods (automated & manual)
5. Post-deployment configuration
6. SSL/HTTPS setup (Let's Encrypt)
7. Domain configuration
8. Monitoring & maintenance
9. Troubleshooting
10. Backup & restore
11. Security checklist

**For**: Experienced users or detailed reference

---

### 6. `HOSTINGER_VPS_QUICKSTART.md`
**Purpose**: Simplified quick-start guide for Hostinger

**Sections**:
1. VPS access
2. Initial setup commands
3. Application deployment
4. Verification steps
5. Domain & SSL configuration
6. Common commands
7. Troubleshooting
8. Email setup help

**For**: Beginners or quick deployment

---

## Deployment Workflow

### First-Time Deployment

```
1. Connect to VPS
   ↓
2. Install Docker & Docker Compose
   ↓
3. Clone repository
   ↓
4. Configure .env file
   ↓
5. Run ./scripts/deploy-vps.sh
   ↓
6. Access application
   ↓
7. Configure domain & SSL (optional)
```

### Updates

```
1. Connect to VPS
   ↓
2. cd /opt/SPTracker
   ↓
3. git pull
   ↓
4. docker-compose -f docker-compose.prod.yml up -d --build
```

---

## File Structure After Deployment

```
/opt/SPTracker/
├── .env                          # Your configuration (not in Git)
├── .env.production              # Template
├── docker-compose.prod.yml      # Production compose
├── docker-compose.yml           # Development compose
├── DEPLOYMENT_GUIDE.md          # Full guide
├── HOSTINGER_VPS_QUICKSTART.md  # Quick start
├── FUNCTIONAL_SPECIFICATION.md  # Feature docs
├── backend/
│   ├── logs/                    # Application logs
│   └── src/                     # .NET source code
├── frontend/
│   ├── agent/                   # Agent portal
│   └── portal/                  # Customer portal
├── nginx/
│   ├── nginx.conf              # Development config
│   ├── nginx.prod.conf         # Production config
│   └── ssl/                    # SSL certificates
│       ├── cert.pem
│       └── key.pem
└── scripts/
    └── deploy-vps.sh           # Deployment script
```

---

## Environment Variables Reference

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `Strong_Pass_123!` |
| `JWT_KEY` | JWT signing key (32+ chars) | `random-32-char-string` |
| `MINIO_ROOT_USER` | MinIO username | `admin` |
| `MINIO_ROOT_PASSWORD` | MinIO password | `Strong_Pass_456!` |
| `SMTP_HOST` | Email server | `smtp.gmail.com` |
| `SMTP_PORT` | Email port | `587` |
| `SMTP_USER` | Email username | `you@domain.com` |
| `SMTP_PASS` | Email password | `app-password` |
| `SMTP_FROM` | From address | `noreply@domain.com` |
| `APP_BASE_URL` | API URL | `https://api.domain.com` |
| `PORTAL_ADMIN_URL` | Agent portal URL | `https://agent.domain.com` |
| `PORTAL_AGENT_URL` | Customer portal URL | `https://portal.domain.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `sptrack` |
| `POSTGRES_USER` | Database user | `postgres` |
| `IMAP_HOST` | IMAP server | - |
| `IMAP_PORT` | IMAP port | `993` |
| `IMAP_USER` | IMAP username | - |
| `IMAP_PASS` | IMAP password | - |
| `TENANT_DEFAULT_TIMEZONE` | Default timezone | `Asia/Dubai` |

---

## Security Considerations

### ✅ Implemented

- JWT authentication
- Role-based access control
- Docker network isolation
- Environment-based secrets
- SSL/HTTPS ready
- Rate limiting in Nginx
- Security headers

### ⚠️ Needs Configuration

1. **SSL Certificates**: Use Let's Encrypt for production
2. **Hangfire Dashboard**: Restrict access by IP or remove
3. **Firewall**: Configure UFW to allow only necessary ports
4. **Strong Passwords**: Replace all default credentials
5. **Regular Updates**: Keep system and Docker images updated

### 🔒 Production Checklist

```bash
# Set secure permissions
chmod 600 /opt/SPTracker/.env
chmod 600 /opt/SPTracker/nginx/ssl/*.pem

# Enable firewall
ufw enable
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS

# Disable password SSH (use keys)
nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
systemctl restart sshd
```

---

## Backup Strategy

### Automated Daily Backups

The deployment guide includes a backup script that:
- Backs up PostgreSQL database
- Backs up MinIO file storage
- Keeps last 7 days of backups
- Runs daily at 2 AM

**Setup**:
```bash
chmod +x /opt/backups/backup-sptracker.sh
crontab -e
# Add: 0 2 * * * /opt/backups/backup-sptracker.sh
```

### Manual Backup

```bash
# Database
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres sptrack | gzip > backup.sql.gz

# MinIO files
mc mirror sptrack/sptrack-attachments /opt/backups/minio/
```

---

## Monitoring

### Container Status

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats

# System resources
htop
```

### Logs

```bash
# Follow all logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 api
```

### Health Checks

```bash
# API health
curl http://localhost:5000/api/health

# PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

---

## Common Tasks

### Update Application

```bash
cd /opt/SPTracker
git pull
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Restart Service

```bash
docker-compose -f docker-compose.prod.yml restart api
```

### View Database

```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d sptrack
```

### Access MinIO Console

Open browser: `http://YOUR_VPS_IP:9001`

Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from `.env`

---

## Support Resources

1. **DEPLOYMENT_GUIDE.md**: Complete deployment instructions
2. **HOSTINGER_VPS_QUICKSTART.md**: Quick start for Hostinger
3. **FUNCTIONAL_SPECIFICATION.md**: Application features and API docs
4. **Hostinger VPS Tutorials**: https://www.hostinger.com/tutorials/vps
5. **Docker Docs**: https://docs.docker.com

---

## Next Steps After Deployment

1. ✅ Access application and login
2. ✅ Change default passwords
3. ✅ Configure your domain DNS
4. ✅ Set up SSL/HTTPS with Let's Encrypt
5. ✅ Create your first tenant
6. ✅ Add users (agents and customers)
7. ✅ Configure SLA policies
8. ✅ Set up email integration
9. ✅ Test ticket creation and workflows
10. ✅ Schedule regular backups

---

## Differences: Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Compose File | `docker-compose.yml` | `docker-compose.prod.yml` |
| Environment | `Development` | `Production` |
| Ports Exposed | All (including DB) | Only web (80, 443) |
| Restart Policy | No | `unless-stopped` |
| SSL | No | Yes |
| Rate Limiting | No | Yes |
| Logs | Console | File + Console |
| Networks | Default bridge | Custom bridge |
| Secrets | In file | From `.env` |

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Port in use | `lsof -i :80` then stop conflicting service |
| Container won't start | Check logs: `docker-compose logs [service]` |
| Can't connect | Check firewall: `ufw status` |
| Database error | Restart: `docker-compose restart postgres` |
| Email not sending | Verify `.env` SMTP settings |
| Out of space | Clean: `docker system prune -a` |
| SSL not working | Check cert paths in nginx config |

---

**Deployment files created successfully!**

You now have everything needed to deploy SP Tracker to your Hostinger VPS.

Start with **HOSTINGER_VPS_QUICKSTART.md** for a simple guided deployment.
