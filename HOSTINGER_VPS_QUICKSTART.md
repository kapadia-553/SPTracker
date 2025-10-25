# Hostinger VPS Quick Start Guide

A simplified, step-by-step guide specifically for deploying SP Tracker on Hostinger VPS.

## Prerequisites

- Hostinger VPS with Ubuntu (active subscription)
- Domain name pointed to your VPS IP (optional but recommended)
- SMTP email account for sending emails

---

## Step 1: Access Your Hostinger VPS

### From Hostinger Panel

1. Login to Hostinger at https://hpanel.hostinger.com
2. Go to **VPS** section
3. Click on your VPS
4. Click **"Access VPS"** or use SSH credentials shown

### From Your Computer

```bash
ssh root@YOUR_VPS_IP
```

Replace `YOUR_VPS_IP` with the IP shown in Hostinger panel.

---

## Step 2: Initial VPS Setup (One-time)

Run these commands to prepare your VPS:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install required tools
apt install -y git curl wget nano

# Setup firewall
apt install -y ufw
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Verify installations
docker --version
docker-compose --version
```

---

## Step 3: Deploy SP Tracker

### Download the Application

```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/SPTracker.git
cd SPTracker
```

**Note**: Replace with your actual repository URL.

### Configure Environment

```bash
# Copy the production environment template
cp .env.production .env

# Edit configuration
nano .env
```

### Fill in These Required Values

```bash
# 1. Database Password (generate with: openssl rand -base64 32)
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# 2. JWT Secret Key (generate with: openssl rand -base64 32)
JWT_KEY=YOUR_32_CHAR_RANDOM_STRING_HERE

# 3. MinIO Storage Credentials
MINIO_ROOT_USER=YOUR_MINIO_USERNAME
MINIO_ROOT_PASSWORD=YOUR_MINIO_PASSWORD

# 4. Email Settings (SMTP)
SMTP_HOST=smtp.office365.com         # Or smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@yourdomain.com
SMTP_PASS=your-email-app-password
SMTP_FROM=noreply@yourdomain.com

# 5. Email Settings (IMAP) - Optional, for email-to-ticket
IMAP_HOST=outlook.office365.com      # Or imap.gmail.com
IMAP_PORT=993
IMAP_USER=support@yourdomain.com
IMAP_PASS=your-email-app-password

# 6. Application URLs - Update with your domain or VPS IP
APP_BASE_URL=http://YOUR_VPS_IP:5000
PORTAL_ADMIN_URL=http://YOUR_VPS_IP:8080
PORTAL_AGENT_URL=http://YOUR_VPS_IP:8081

# 7. Timezone
TENANT_DEFAULT_TIMEZONE=Asia/Dubai   # Or your timezone
```

**Save the file**: Press `Ctrl+X`, then `Y`, then `Enter`

### Generate Secure Passwords

If you need help generating secure passwords:

```bash
# Generate database password
echo "Database Password:" && openssl rand -base64 32

# Generate JWT secret
echo "JWT Secret:" && openssl rand -base64 32

# Generate MinIO credentials
echo "MinIO Username:" && openssl rand -base64 12
echo "MinIO Password:" && openssl rand -base64 32
```

Copy these values into your `.env` file.

---

## Step 4: Deploy Application

### Option A: Automated Deployment (Easiest)

```bash
# Make script executable
chmod +x scripts/deploy-vps.sh

# Run deployment
./scripts/deploy-vps.sh
```

This script will:
- Validate your configuration
- Build and start all containers
- Set up MinIO storage
- Optionally seed demo data

**Answer prompts**:
- Self-signed SSL? Type `n` for now (we'll set up proper SSL later)
- Seed database? Type `y` to create demo accounts

### Option B: Manual Deployment

```bash
# Create required directories
mkdir -p backend/logs nginx/ssl

# Build and start containers
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait 30 seconds for services to start
sleep 30

# Initialize MinIO
wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Configure MinIO (replace with your credentials from .env)
mc alias set sptrack http://localhost:9000 YOUR_MINIO_USER YOUR_MINIO_PASSWORD
mc mb sptrack/sptrack-attachments
mc anonymous set download sptrack/sptrack-attachments

# Seed database (optional)
curl -X POST http://localhost:5000/api/admin/seed
```

---

## Step 5: Verify Deployment

### Check All Services Are Running

```bash
docker-compose -f docker-compose.prod.yml ps
```

You should see all services with "Up" status:
- postgres
- redis
- minio
- clamav
- api
- worker
- agent
- portal
- nginx

### Test API Health

```bash
curl http://localhost:5000/api/health
```

Should return: `{"status":"Healthy"}`

---

## Step 6: Access Your Application

Open your browser and visit:

- **Agent Portal**: `http://YOUR_VPS_IP:8080`
- **Customer Portal**: `http://YOUR_VPS_IP:8081`
- **API**: `http://YOUR_VPS_IP:5000`

Replace `YOUR_VPS_IP` with your actual Hostinger VPS IP address.

### Default Login Credentials (if seeded)

**Admin Account**:
- Email: `admin@spsolutions.ae`
- Password: `Admin@12345`

**Agent Account**:
- Email: `abdul@spsolutions.org`
- Password: `Agent@12345`

**Customer Account**:
- Email: `kapadia552@gmail.com`
- Password: `Customer@12345`

**⚠️ IMPORTANT**: Change these passwords immediately after first login!

---

## Step 7: Configure Your Domain (Optional)

### Update DNS Records

In your domain registrar (Namecheap, GoDaddy, etc.), add:

```
Type    Name        Value           TTL
A       @           YOUR_VPS_IP     3600
A       www         YOUR_VPS_IP     3600
```

Wait 15-60 minutes for DNS to propagate.

### Update Environment File

```bash
nano /opt/SPTracker/.env
```

Update these lines with your domain:

```bash
APP_BASE_URL=https://api.yourdomain.com
PORTAL_ADMIN_URL=https://agent.yourdomain.com
PORTAL_AGENT_URL=https://portal.yourdomain.com
```

### Set Up SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot

# Stop nginx temporarily
docker-compose -f docker-compose.prod.yml stop nginx

# Generate certificate (replace with your domain)
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/SPTracker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/SPTracker/nginx/ssl/key.pem

# Update Nginx config
nano /opt/SPTracker/nginx/nginx.prod.conf
```

In the nginx config, uncomment these lines:

```nginx
listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Test HTTPS
curl https://yourdomain.com
```

---

## Common Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service (api, worker, nginx, etc.)
docker-compose -f docker-compose.prod.yml logs -f api
```

Press `Ctrl+C` to exit logs.

### Restart Service

```bash
docker-compose -f docker-compose.prod.yml restart api
```

### Stop Everything

```bash
docker-compose -f docker-compose.prod.yml down
```

### Start Everything

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Update Application

```bash
cd /opt/SPTracker
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup Database

```bash
mkdir -p /opt/backups
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres sptrack | gzip > /opt/backups/sptrack_$(date +%Y%m%d).sql.gz
```

---

## Troubleshooting

### Issue: Port 80 Already in Use

```bash
# Check what's using port 80
lsof -i :80

# If Apache is running
systemctl stop apache2
systemctl disable apache2

# Restart your application
docker-compose -f docker-compose.prod.yml restart nginx
```

### Issue: Container Won't Start

```bash
# Check logs for the failing service
docker-compose -f docker-compose.prod.yml logs [service-name]

# Common fixes:
# 1. Restart the service
docker-compose -f docker-compose.prod.yml restart [service-name]

# 2. Rebuild the service
docker-compose -f docker-compose.prod.yml up -d --build [service-name]
```

### Issue: Can't Access from Browser

```bash
# Check firewall
ufw status

# Make sure ports 80 and 443 are allowed
ufw allow 80/tcp
ufw allow 443/tcp

# Check Hostinger firewall in hPanel
# Go to VPS > Firewall and ensure ports 80, 443 are open
```

### Issue: Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres

# Check password in .env matches docker-compose
nano .env
```

### Issue: Email Not Sending

1. Verify SMTP settings in `.env`
2. For Gmail: Enable "Less secure app access" or use App Password
3. For Office 365: Use App Password
4. Check logs: `docker-compose -f docker-compose.prod.yml logs api | grep -i email`

---

## Email Configuration Help

### Gmail Setup

1. Enable 2-Factor Authentication in Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate App Password for "Mail"
4. Use this App Password in `.env` file:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Office 365 / Outlook Setup

1. Enable 2FA in Microsoft Account
2. Go to: https://account.microsoft.com/security
3. Create App Password
4. Use in `.env`:

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
```

---

## Security Checklist

After deployment, ensure:

- [ ] Changed all default passwords
- [ ] Strong passwords in `.env` file
- [ ] Firewall enabled and configured
- [ ] SSL certificate installed (for production)
- [ ] Only necessary ports open
- [ ] Regular backups scheduled
- [ ] `.env` file has restricted permissions: `chmod 600 .env`

---

## Need More Help?

- **Full Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **Functional Spec**: See `FUNCTIONAL_SPECIFICATION.md` for feature details
- **Hostinger Support**: https://www.hostinger.com/tutorials/vps

---

## Quick Recap

1. **Connect to VPS**: `ssh root@YOUR_VPS_IP`
2. **Install Docker & Docker Compose** (one-time)
3. **Clone repository**: `git clone ... && cd SPTracker`
4. **Configure**: `cp .env.production .env && nano .env`
5. **Deploy**: `./scripts/deploy-vps.sh`
6. **Access**: `http://YOUR_VPS_IP:8080`

That's it! Your SP Tracker is now running on Hostinger VPS.

---

**Happy Tracking!**
