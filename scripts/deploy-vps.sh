#!/bin/bash

# =============================================================================
# SP Tracker - VPS Deployment Script
# =============================================================================
# This script automates the deployment of SP Tracker on a VPS with Docker
#
# Usage:
#   chmod +x deploy-vps.sh
#   ./deploy-vps.sh
#
# Prerequisites:
#   - Docker and Docker Compose installed on VPS
#   - Git installed
#   - Proper .env file configured
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user with sudo privileges."
fi

print_info "Starting SP Tracker deployment..."

# =============================================================================
# Step 1: Check Prerequisites
# =============================================================================
print_info "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed: $(docker --version)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

# Check Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi
print_success "Git is installed: $(git --version)"

# =============================================================================
# Step 2: Environment Configuration
# =============================================================================
print_info "Checking environment configuration..."

if [ ! -f ".env" ]; then
    print_warning ".env file not found."
    if [ -f ".env.production" ]; then
        print_info "Copying .env.production to .env"
        cp .env.production .env
        print_error "Please edit the .env file with your actual configuration values."
        print_info "Run: nano .env"
        exit 1
    elif [ -f ".env.example" ]; then
        print_info "Copying .env.example to .env"
        cp .env.example .env
        print_error "Please edit the .env file with your actual configuration values."
        print_info "Run: nano .env"
        exit 1
    else
        print_error "No environment template file found (.env.production or .env.example)"
        exit 1
    fi
fi

# Check if .env file has been configured (check for CHANGE_ME markers)
if grep -q "CHANGE_ME" .env; then
    print_error ".env file contains default values (CHANGE_ME). Please configure it first."
    print_info "Run: nano .env"
    exit 1
fi

print_success ".env file is configured"

# =============================================================================
# Step 3: Create required directories
# =============================================================================
print_info "Creating required directories..."

mkdir -p backend/logs
mkdir -p nginx/ssl

print_success "Directories created"

# =============================================================================
# Step 4: SSL Certificate Setup
# =============================================================================
print_info "Checking SSL certificates..."

if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    print_warning "SSL certificates not found."

    read -p "Do you want to generate self-signed certificates for testing? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Generating self-signed SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=AE/ST=Dubai/L=Dubai/O=SP Solutions/CN=sptrack.local"
        print_success "Self-signed certificates generated"
        print_warning "For production, please use proper SSL certificates (e.g., Let's Encrypt)"
    else
        print_info "Skipping SSL setup. HTTP only will be used."
        print_warning "For production, SSL is highly recommended"
    fi
fi

# =============================================================================
# Step 5: Stop existing containers (if any)
# =============================================================================
print_info "Stopping existing containers (if any)..."

if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml down || true
else
    docker-compose down || true
fi

print_success "Existing containers stopped"

# =============================================================================
# Step 6: Build and start containers
# =============================================================================
print_info "Building and starting containers..."

if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

print_info "Using compose file: $COMPOSE_FILE"

docker-compose -f $COMPOSE_FILE build --no-cache
docker-compose -f $COMPOSE_FILE up -d

print_success "Containers started"

# =============================================================================
# Step 7: Wait for services to be healthy
# =============================================================================
print_info "Waiting for services to be healthy..."

# Wait for database
print_info "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U postgres &> /dev/null; then
        print_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start within timeout"
        exit 1
    fi
    sleep 2
done

# Wait for API
print_info "Waiting for API service..."
sleep 10  # Give the API time to start and run migrations

for i in {1..30}; do
    if curl -f http://localhost:5000/api/health &> /dev/null || \
       docker-compose -f $COMPOSE_FILE exec -T nginx curl -f http://api:8080/api/health &> /dev/null; then
        print_success "API is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "API failed to start within timeout"
        print_info "Check logs: docker-compose -f $COMPOSE_FILE logs api"
        exit 1
    fi
    sleep 3
done

# =============================================================================
# Step 8: Initialize MinIO bucket
# =============================================================================
print_info "Checking MinIO bucket..."

# Install mc (MinIO Client) if not present
if ! command -v mc &> /dev/null; then
    print_info "Installing MinIO Client..."
    wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
    chmod +x /usr/local/bin/mc
fi

# Configure MinIO client and create bucket
MINIO_USER=$(grep MINIO_ROOT_USER .env | cut -d '=' -f2)
MINIO_PASS=$(grep MINIO_ROOT_PASSWORD .env | cut -d '=' -f2)

mc alias set sptrack http://localhost:9000 $MINIO_USER $MINIO_PASS &> /dev/null || true
mc mb sptrack/sptrack-attachments &> /dev/null || print_info "Bucket already exists"
mc anonymous set download sptrack/sptrack-attachments &> /dev/null || true

print_success "MinIO configured"

# =============================================================================
# Step 9: Seed database (optional)
# =============================================================================
read -p "Do you want to seed the database with demo data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Seeding database..."
    curl -X POST http://localhost:5000/api/admin/seed || print_warning "Seeding failed or already completed"
    print_success "Database seeded"
fi

# =============================================================================
# Step 10: Display deployment information
# =============================================================================
print_success "Deployment completed successfully!"

echo ""
echo "========================================================================="
echo "                    SP TRACKER DEPLOYMENT INFO"
echo "========================================================================="
echo ""
echo "Services:"
echo "  - API:              http://$(hostname -I | awk '{print $1}'):5000"
echo "  - Agent Portal:     http://$(hostname -I | awk '{print $1}'):8080"
echo "  - Customer Portal:  http://$(hostname -I | awk '{print $1}'):8081"
echo "  - Nginx Proxy:      http://$(hostname -I | awk '{print $1}')"
echo "  - MinIO Console:    http://$(hostname -I | awk '{print $1}'):9001"
echo "  - Hangfire:         http://$(hostname -I | awk '{print $1}'):5000/hangfire"
echo ""
echo "Default Credentials (if seeded):"
echo "  - Admin:   admin@spsolutions.ae / Admin@12345"
echo "  - Agent:   abdul@spsolutions.org / Agent@12345"
echo "  - Customer: kapadia552@gmail.com / Customer@12345"
echo ""
echo "Useful Commands:"
echo "  - View logs:        docker-compose -f $COMPOSE_FILE logs -f [service]"
echo "  - Restart service:  docker-compose -f $COMPOSE_FILE restart [service]"
echo "  - Stop all:         docker-compose -f $COMPOSE_FILE down"
echo "  - Update app:       git pull && ./deploy-vps.sh"
echo ""
echo "========================================================================="
echo ""

print_warning "IMPORTANT NEXT STEPS:"
echo "  1. Configure your domain DNS to point to this server's IP"
echo "  2. Update .env file with your actual domain names"
echo "  3. Install proper SSL certificates (Let's Encrypt recommended)"
echo "  4. Configure firewall rules (allow ports 80, 443)"
echo "  5. Set up regular backups for PostgreSQL and MinIO data"
echo "  6. Secure the Hangfire dashboard (/hangfire endpoint)"
echo ""

print_info "For support, check the documentation or visit: https://github.com/your-repo"
