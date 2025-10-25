# SP Tracker - VPS Deployment Guide

Complete guide to deploy SP Tracker on a Hostinger VPS (or any VPS with Docker support).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Preparation](#pre-deployment-preparation)
3. [VPS Setup](#vps-setup)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Domain Configuration](#domain-configuration)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Backup & Restore](#backup--restore)

---

## Prerequisites

### Local Machine Requirements
- Git installed
- SSH client
- Text editor

### VPS Requirements (Minimum)
- **OS**: Ubuntu 20.04 LTS or newer (recommended)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 40GB minimum
- **CPU**: 2 cores minimum
- **Software**: Docker and Docker Compose installed

### External Services
- Domain name (optional but recommended)
- SMTP server for emails (Office 365, Gmail, SendGrid, etc.)
- IMAP server for email ticket creation (optional)

---

## Pre-Deployment Preparation

### 1. Gather Required Information

Before starting, collect:

- **VPS IP Address**: Your Hostinger VPS IP
- **Domain Name**: Your domain (e.g., `sptracker.com`)
- **SMTP Credentials**: Email server settings
- **Database Password**: Strong password for PostgreSQL
- **JWT Secret**: Random 32+ character string
- **MinIO Credentials**: Username and password for object storage

### 2. Generate Secure Secrets

Generate strong secrets using these commands:

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate PostgreSQL Password
openssl rand -base64 32

# Generate MinIO Credentials
openssl rand -base64 16
```

Save these securely - you'll need them for the `.env` file.

---

## VPS Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Update System Packages

```bash
apt update && apt upgrade -y
```

### Step 3: Install Docker

If Docker is not already installed on your Hostinger VPS:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker service
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
```

### Step 4: Install Docker Compose

```bash
# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 5: Install Additional Tools

```bash
# Install useful tools
apt install -y git curl wget nano htop
```

### Step 6: Configure Firewall (Optional but Recommended)

```bash
# Install UFW
apt install -y ufw

# Allow SSH (IMPORTANT: Do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

#### 1. Clone the Repository

```bash
cd /opt
git clone <your-repo-url> SPTracker
cd SPTracker
```

#### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit configuration
nano .env
```

**Important**: Replace ALL placeholder values:

```bash
# Database
POSTGRES_PASSWORD=your-strong-password-here

# JWT
JWT_KEY=your-32-char-random-string-here

# MinIO
MINIO_ROOT_USER=your-minio-username
MINIO_ROOT_PASSWORD=your-strong-minio-password

# SMTP
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=yourname@yourdomain.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# IMAP (Optional)
IMAP_HOST=outlook.office365.com
IMAP_PORT=993
IMAP_USER=support@yourdomain.com
IMAP_PASS=your-app-password

# Application URLs (replace with your domain)
APP_BASE_URL=https://api.yourdomain.com
PORTAL_ADMIN_URL=https://agent.yourdomain.com
PORTAL_AGENT_URL=https://portal.yourdomain.com

# Timezone
TENANT_DEFAULT_TIMEZONE=Asia/Dubai
```

Save and exit (Ctrl+X, then Y, then Enter in nano).

#### 3. Run Deployment Script

```bash
# Make script executable
chmod +x scripts/deploy-vps.sh

# Run deployment
./scripts/deploy-vps.sh
```

The script will:
- Check prerequisites
- Validate environment configuration
- Generate SSL certificates (optional)
- Build and start all containers
- Initialize MinIO bucket
- Optionally seed demo data

---

### Method 2: Manual Deployment

#### 1. Clone Repository

```bash
cd /opt
git clone <your-repo-url> SPTracker
cd SPTracker
```

#### 2. Configure Environment

```bash
cp .env.production .env
nano .env
# Fill in all required values (see Method 1, Step 2)
```

#### 3. Create Required Directories

```bash
mkdir -p backend/logs
mkdir -p nginx/ssl
```

#### 4. Generate Self-Signed SSL (for testing)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=AE/ST=Dubai/L=Dubai/O=SP Solutions/CN=yourdomain.com"
```

#### 5. Build and Start Containers

```bash
# Build containers
docker-compose -f docker-compose.prod.yml build --no-cache

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

#### 6. Wait for Services

```bash
# Watch API logs until migrations complete
docker-compose -f docker-compose.prod.yml logs -f api

# Wait for: "Now listening on: http://[::]:8080"
```

Press Ctrl+C to exit logs.

#### 7. Initialize MinIO

```bash
# Install MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Configure MinIO
mc alias set sptrack http://localhost:9000 <MINIO_USER> <MINIO_PASSWORD>

# Create bucket
mc mb sptrack/sptrack-attachments
mc anonymous set download sptrack/sptrack-attachments
```

#### 8. Seed Database (Optional)

```bash
curl -X POST http://localhost:5000/api/admin/seed
```

---

## Post-Deployment Configuration

### 1. Verify Services

Check all services are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

All services should show "Up" status.

### 2. Test API Health

```bash
curl http://localhost:5000/api/health
```

Should return: `{"status":"Healthy"}`

### 3. Access Portals

**From Local Browser** (replace with your VPS IP):

- **Agent Portal**: http://YOUR_VPS_IP:8080
- **Customer Portal**: http://YOUR_VPS_IP:8081
- **API**: http://YOUR_VPS_IP:5000
- **MinIO Console**: http://YOUR_VPS_IP:9001

### 4. Login with Default Credentials

If you seeded the database:

- **Admin**: admin@spsolutions.ae / Admin@12345
- **Agent**: abdul@spsolutions.org / Agent@12345
- **Customer**: kapadia552@gmail.com / Customer@12345

**⚠️ IMPORTANT**: Change these passwords immediately in production!

---

## SSL/HTTPS Setup

### Option 1: Let's Encrypt (Recommended for Production)

#### 1. Install Certbot

```bash
apt install -y certbot
```

#### 2. Stop Nginx Temporarily

```bash
docker-compose -f docker-compose.prod.yml stop nginx
```

#### 3. Generate Certificates

```bash
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certificates will be saved in `/etc/letsencrypt/live/yourdomain.com/`

#### 4. Copy Certificates

```bash
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/SPTracker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/SPTracker/nginx/ssl/key.pem
```

#### 5. Update Nginx Configuration

Edit `nginx/nginx.prod.conf`:

```bash
nano /opt/SPTracker/nginx/nginx.prod.conf
```

Uncomment these lines:

```nginx
# Uncomment these:
listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
# ... all other SSL lines
```

Also uncomment the HTTP to HTTPS redirect block at the top.

#### 6. Restart Nginx

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

#### 7. Set Up Auto-Renewal

```bash
# Add cron job
crontab -e

# Add this line:
0 3 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/SPTracker/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/SPTracker/nginx/ssl/key.pem && docker-compose -f /opt/SPTracker/docker-compose.prod.yml restart nginx"
```

---

### Option 2: Cloudflare SSL (Alternative)

If using Cloudflare:

1. Point your domain to Cloudflare
2. Enable "Full (Strict)" SSL mode in Cloudflare
3. Generate Cloudflare Origin Certificate
4. Download certificate and key
5. Place in `nginx/ssl/` directory
6. Update nginx configuration (same as Option 1, step 5)

---

## Domain Configuration

### 1. Point Domain to VPS

In your domain registrar (GoDaddy, Namecheap, etc.):

```
Type    Name        Value           TTL
A       @           YOUR_VPS_IP     3600
A       www         YOUR_VPS_IP     3600
A       api         YOUR_VPS_IP     3600
A       agent       YOUR_VPS_IP     3600
A       portal      YOUR_VPS_IP     3600
```

### 2. Update Nginx for Subdomains (Optional)

For subdomain support, edit `nginx/nginx.prod.conf`:

```nginx
# API subdomain
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # ... SSL config ...

    location / {
        proxy_pass http://api;
        # ... proxy headers ...
    }
}

# Agent subdomain
server {
    listen 443 ssl http2;
    server_name agent.yourdomain.com;

    # ... SSL config ...

    location / {
        proxy_pass http://agent;
        # ... proxy headers ...
    }
}

# Customer subdomain
server {
    listen 443 ssl http2;
    server_name portal.yourdomain.com;

    # ... SSL config ...

    location / {
        proxy_pass http://portal;
        # ... proxy headers ...
    }
}
```

Restart Nginx:

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f worker

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 api
```

### Monitor Resource Usage

```bash
# Container stats
docker stats

# System resources
htop
```

### Restart Services

```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart api

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Stop and start (full restart)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Update Application

```bash
cd /opt/SPTracker

# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: "Port 80 is already allocated"

**Solution**:
```bash
# Find what's using port 80
lsof -i :80

# If it's Apache or Nginx
systemctl stop apache2
systemctl stop nginx
systemctl disable apache2
systemctl disable nginx
```

#### 2. Database Connection Failed

**Check**:
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d sptrack
```

#### 3. API Returns 502 Bad Gateway

**Check**:
```bash
# Check API logs
docker-compose -f docker-compose.prod.yml logs api

# Check if API is listening
docker-compose -f docker-compose.prod.yml exec api netstat -tuln | grep 8080

# Restart API
docker-compose -f docker-compose.prod.yml restart api
```

#### 4. MinIO Bucket Not Found

```bash
# Check MinIO is running
docker-compose -f docker-compose.prod.yml ps minio

# Recreate bucket
mc mb sptrack/sptrack-attachments
```

#### 5. Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker system
docker system prune -a --volumes

# Remove old logs
truncate -s 0 /opt/SPTracker/backend/logs/*.log
```

#### 6. Email Not Sending

**Check**:
```bash
# Test SMTP from container
docker-compose -f docker-compose.prod.yml exec api curl -v smtp://smtp.office365.com:587

# Check API logs for email errors
docker-compose -f docker-compose.prod.yml logs api | grep -i email
```

**Verify .env settings**:
- Correct SMTP host and port
- Valid credentials
- App password (not regular password for Gmail/Office365)

---

## Backup & Restore

### Database Backup

#### Create Backup

```bash
# Create backup directory
mkdir -p /opt/backups/sptracker

# Backup database
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres sptrack > /opt/backups/sptracker/backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip /opt/backups/sptracker/backup_*.sql
```

#### Automated Daily Backups

```bash
# Create backup script
cat > /opt/backups/backup-sptracker.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/sptracker"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose -f /opt/SPTracker/docker-compose.prod.yml exec -T postgres pg_dump -U postgres sptrack | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup MinIO data
docker-compose -f /opt/SPTracker/docker-compose.prod.yml exec -T minio tar czf - /data > $BACKUP_DIR/minio_$DATE.tar.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make executable
chmod +x /opt/backups/backup-sptracker.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /opt/backups/backup-sptracker.sh >> /var/log/sptracker-backup.log 2>&1
```

#### Restore Database

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop api worker

# Restore backup
gunzip -c /opt/backups/sptracker/backup_20250101_020000.sql.gz | \
  docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d sptrack

# Restart application
docker-compose -f docker-compose.prod.yml start api worker
```

### File Storage Backup

#### Backup MinIO Data

```bash
# Backup MinIO bucket
mc mirror sptrack/sptrack-attachments /opt/backups/sptracker/minio-backup/
```

#### Restore MinIO Data

```bash
# Restore from backup
mc mirror /opt/backups/sptracker/minio-backup/ sptrack/sptrack-attachments
```

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Strong database password set
- [ ] JWT secret is random and secure
- [ ] SSL/HTTPS enabled with valid certificates
- [ ] Firewall configured (UFW/iptables)
- [ ] Only necessary ports open (80, 443, 22)
- [ ] SSH key authentication enabled (password auth disabled)
- [ ] Hangfire dashboard access restricted
- [ ] Regular backups scheduled
- [ ] Docker containers running as non-root (where possible)
- [ ] Environment file (.env) has restricted permissions
- [ ] PostgreSQL not exposed to public (only internal network)
- [ ] MinIO credentials changed from defaults
- [ ] Rate limiting enabled in Nginx

### Set Secure File Permissions

```bash
chmod 600 /opt/SPTracker/.env
chmod 600 /opt/SPTracker/nginx/ssl/*.pem
```

---

## Performance Optimization

### 1. Enable Redis Caching

Redis is already running but not utilized. Future optimization can implement caching.

### 2. Database Connection Pooling

Already configured in EF Core.

### 3. CDN for Static Assets

Consider using Cloudflare CDN for frontend assets.

### 4. Database Indexing

Monitor slow queries and add indexes as needed.

---

## Support

For issues or questions:

- **Documentation**: FUNCTIONAL_SPECIFICATION.md
- **Security Issues**: security@spsolutions.ae
- **GitHub Issues**: (Add your repo URL)

---

## Quick Reference Commands

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Restart service
docker-compose -f docker-compose.prod.yml restart [service]

# Update application
cd /opt/SPTracker && git pull && docker-compose -f docker-compose.prod.yml up -d --build

# Backup database
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres sptrack | gzip > backup.sql.gz

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check disk usage
docker system df

# Clean unused Docker resources
docker system prune -a
```

---

**End of Deployment Guide**
