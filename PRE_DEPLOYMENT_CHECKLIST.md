# Pre-Deployment Checklist

Use this checklist before deploying SP Tracker to production.

## ✅ VPS/Server Preparation

- [ ] VPS/Server provisioned (minimum 4GB RAM, 2 CPU cores, 40GB storage)
- [ ] Ubuntu 20.04 LTS or newer installed
- [ ] Root or sudo access available
- [ ] Server IP address noted: `___________________`
- [ ] SSH access verified
- [ ] Server timezone configured correctly

---

## ✅ Domain & DNS

- [ ] Domain name purchased: `___________________`
- [ ] DNS A records configured:
  - [ ] `@` (root) → VPS IP
  - [ ] `www` → VPS IP
  - [ ] `api` → VPS IP (optional, for subdomain)
  - [ ] `agent` → VPS IP (optional, for subdomain)
  - [ ] `portal` → VPS IP (optional, for subdomain)
- [ ] DNS propagation verified (use: https://dnschecker.org)

---

## ✅ Email Configuration

### SMTP (Outbound Emails)

- [ ] Email service selected:
  - [ ] Office 365 / Outlook
  - [ ] Gmail
  - [ ] SendGrid
  - [ ] Other: `___________________`

- [ ] SMTP credentials obtained:
  - Host: `___________________`
  - Port: `___________________`
  - Username: `___________________`
  - Password/App Password: `___________________`
  - From Address: `___________________`

- [ ] App password created (if using Gmail/Office365 with 2FA)
- [ ] Test email sent successfully

### IMAP (Inbound Email-to-Ticket) - Optional

- [ ] IMAP enabled for email account
- [ ] IMAP credentials obtained:
  - Host: `___________________`
  - Port: `___________________`
  - Username: `___________________`
  - Password: `___________________`

---

## ✅ Security Credentials

### Database

- [ ] Strong PostgreSQL password generated
  ```bash
  openssl rand -base64 32
  ```
  Password: `___________________`

### JWT Secret

- [ ] JWT secret key generated (32+ characters)
  ```bash
  openssl rand -base64 32
  ```
  Key: `___________________`

### MinIO Storage

- [ ] MinIO username chosen: `___________________`
- [ ] MinIO password generated:
  ```bash
  openssl rand -base64 32
  ```
  Password: `___________________`

---

## ✅ SSL/HTTPS Certificate

Choose one:

- [ ] **Option A**: Let's Encrypt (Free, recommended for production)
  - [ ] Certbot installation planned
  - [ ] Domain DNS already pointed to server

- [ ] **Option B**: Cloudflare SSL (Free, includes CDN)
  - [ ] Domain added to Cloudflare
  - [ ] Origin certificate generated

- [ ] **Option C**: Self-signed (Testing only)
  - [ ] Will generate during deployment

- [ ] **Option D**: Commercial certificate (e.g., DigiCert)
  - [ ] Certificate files obtained
  - [ ] Private key file available

---

## ✅ Software Requirements

- [ ] Docker installed or installation command ready
- [ ] Docker Compose installed or installation command ready
- [ ] Git installed or installation command ready
- [ ] Firewall planned (UFW recommended)

---

## ✅ Application Configuration

### Timezone

- [ ] Timezone selected: `___________________`

  Common options:
  - Asia/Dubai
  - America/New_York
  - Europe/London
  - Asia/Kolkata
  - Australia/Sydney

### URLs

Plan your application URLs:

- [ ] API URL: `___________________`
  - Example: `https://api.yourdomain.com` or `http://YOUR_IP:5000`

- [ ] Agent Portal URL: `___________________`
  - Example: `https://agent.yourdomain.com` or `http://YOUR_IP:8080`

- [ ] Customer Portal URL: `___________________`
  - Example: `https://portal.yourdomain.com` or `http://YOUR_IP:8081`

---

## ✅ Repository Access

- [ ] GitHub/GitLab account with repository access
- [ ] Repository URL: `___________________`
- [ ] SSH key added to repository (if private)
- [ ] Latest code pushed to main/master branch

---

## ✅ Backup Plan

- [ ] Backup storage location decided: `___________________`
- [ ] Backup schedule planned:
  - [ ] Daily automated backups
  - [ ] Weekly manual backups
  - [ ] Monthly archive
- [ ] Backup retention policy: Keep last `___` days
- [ ] Restore procedure tested (after first backup)

---

## ✅ Monitoring & Alerts

- [ ] Plan for monitoring decided:
  - [ ] Basic: Docker logs + manual checks
  - [ ] Advanced: Prometheus + Grafana
  - [ ] Cloud: CloudWatch, DataDog, etc.

- [ ] Alert channels configured:
  - [ ] Email alerts
  - [ ] Slack notifications
  - [ ] Other: `___________________`

---

## ✅ Team Access

- [ ] Team members who need VPS access listed:
  1. `___________________`
  2. `___________________`
  3. `___________________`

- [ ] SSH keys collected from team members
- [ ] Access levels defined (sudo, docker-only, etc.)

---

## ✅ Initial Users

Plan admin accounts to create:

### Admin User

- [ ] Name: `___________________`
- [ ] Email: `___________________`
- [ ] Temporary Password: `___________________`

### First Tenant

- [ ] Tenant Name: `___________________`
- [ ] Tenant Slug: `___________________`

### Agent Users

1. [ ] Name: `___________________` Email: `___________________`
2. [ ] Name: `___________________` Email: `___________________`
3. [ ] Name: `___________________` Email: `___________________`

---

## ✅ Deployment Files Ready

- [ ] `.env.production` reviewed
- [ ] `docker-compose.prod.yml` reviewed
- [ ] `nginx/nginx.prod.conf` reviewed
- [ ] `scripts/deploy-vps.sh` executable
- [ ] `DEPLOYMENT_GUIDE.md` read
- [ ] `HOSTINGER_VPS_QUICKSTART.md` read (if using Hostinger)

---

## ✅ Pre-Deployment Testing

- [ ] Local development environment tested
- [ ] All features working locally:
  - [ ] User authentication
  - [ ] Ticket creation
  - [ ] Comments
  - [ ] File attachments
  - [ ] Email notifications
  - [ ] SLA tracking
  - [ ] Reports

---

## ✅ Firewall Ports

Plan which ports to open:

- [ ] **Port 22** (SSH) - Required for server access
- [ ] **Port 80** (HTTP) - Required for web traffic
- [ ] **Port 443** (HTTPS) - Required for secure web traffic
- [ ] **Port 5000** (API) - Optional, if accessing directly
- [ ] **Port 8080** (Agent) - Optional, if accessing directly
- [ ] **Port 8081** (Portal) - Optional, if accessing directly
- [ ] **Port 9001** (MinIO) - Optional, for admin access

Recommended: Only open 22, 80, 443 and use reverse proxy.

---

## ✅ Legal & Compliance

- [ ] Privacy policy prepared (if handling customer data)
- [ ] Terms of service prepared
- [ ] GDPR compliance reviewed (if serving EU users)
- [ ] Data retention policy defined
- [ ] Cookie policy prepared (if applicable)

---

## ✅ Documentation

- [ ] Admin documentation prepared
- [ ] User guide created (for agents)
- [ ] Customer portal guide created
- [ ] SLA policies documented
- [ ] Escalation procedures documented
- [ ] Contact support information prepared

---

## ✅ Post-Deployment Plan

- [ ] Smoke testing checklist prepared
- [ ] User acceptance testing planned
- [ ] Training sessions scheduled for team
- [ ] Gradual rollout strategy (if replacing existing system)
- [ ] Rollback plan prepared

---

## ✅ Support & Maintenance

- [ ] On-call rotation planned (if 24/7 support needed)
- [ ] Support ticketing system setup (ironic, I know!)
- [ ] Escalation path defined
- [ ] Vendor support contacts saved (Hostinger, domain registrar, etc.)

---

## ✅ Budget & Costs

Estimated monthly costs calculated:

- [ ] VPS/Hosting: $`___` /month
- [ ] Domain: $`___` /year
- [ ] Email service: $`___` /month (if paid)
- [ ] SSL certificate: $`___` /year (if not using Let's Encrypt)
- [ ] Backup storage: $`___` /month
- [ ] Monitoring tools: $`___` /month
- [ ] **Total estimated**: $`___` /month

---

## ✅ Final Checklist Before Deployment

On deployment day, verify:

- [ ] Team notified of deployment window
- [ ] Maintenance window scheduled (if replacing existing system)
- [ ] All credentials securely stored in password manager
- [ ] VPS/Server accessible via SSH
- [ ] `.env` file configured with actual values (no CHANGE_ME)
- [ ] Domain DNS already propagated (if using domain)
- [ ] Backup of any existing data taken
- [ ] Rollback plan ready
- [ ] Team standing by for testing

---

## ✅ Go/No-Go Decision

**Deployment approved by**:

- [ ] Technical Lead: `___________________` Date: `___________`
- [ ] Project Manager: `___________________` Date: `___________`
- [ ] Stakeholder: `___________________` Date: `___________`

**Decision**:
- [ ] ✅ GO - Proceed with deployment
- [ ] ❌ NO-GO - Reschedule, reason: `___________________`

---

## Post-Deployment Verification

After deployment, verify:

- [ ] All containers running: `docker-compose ps`
- [ ] API health check passing: `curl http://localhost:5000/api/health`
- [ ] Agent portal accessible
- [ ] Customer portal accessible
- [ ] Can login with admin credentials
- [ ] Can create a ticket
- [ ] Can add comments
- [ ] Can upload attachments
- [ ] Email notifications working
- [ ] SSL certificate valid (if HTTPS)
- [ ] Firewall rules active
- [ ] Backups scheduled and tested
- [ ] Monitoring active
- [ ] Team trained and ready

---

## Notes & Additional Items

Use this space for deployment-specific notes:

```
_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________
```

---

## Quick Reference

**Hostinger VPS Access**: https://hpanel.hostinger.com

**Let's Encrypt**: https://letsencrypt.org

**DNS Checker**: https://dnschecker.org

**SSL Test**: https://www.ssllabs.com/ssltest/

**Deployment Guides**:
- Quick Start: `HOSTINGER_VPS_QUICKSTART.md`
- Full Guide: `DEPLOYMENT_GUIDE.md`
- Overview: `DEPLOYMENT_README.md`

---

**Good luck with your deployment! 🚀**

Remember: Take your time, follow the guides, and don't hesitate to test thoroughly before going live.
