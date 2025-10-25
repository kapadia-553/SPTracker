#!/bin/bash

# SP Track Setup Script

echo "🚀 Setting up SP Track..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your SMTP/IMAP credentials before running!"
    echo "⚠️  Update JWT__KEY with a secure random string (32+ characters)"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/logs
mkdir -p infrastructure/db/backups

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "🗃️  Running database migrations..."
docker-compose exec api dotnet ef database update

# Seed initial data
echo "🌱 Seeding initial data..."
curl -X POST "http://localhost:5000/api/admin/seed" -H "Content-Type: application/json" || echo "⚠️  Seeding failed - you can run this manually later"

echo ""
echo "✅ SP Track setup complete!"
echo ""
echo "🌐 Access URLs:"
echo "   Agent Dashboard: http://localhost:8080"
echo "   Customer Portal: http://localhost:8081" 
echo "   API Documentation: http://localhost:5000/swagger"
echo "   Hangfire Dashboard: http://localhost:5000/hangfire"
echo ""
echo "🔑 Default Login (Agent):"
echo "   Email: admin@spsolutions.ae"
echo "   Password: Admin@12345"
echo ""
echo "🔑 Test Customer (Portal):"
echo "   Email: customer@demo.com"
echo "   Tenant: demo"
echo "   (Use magic link authentication)"
echo ""
echo "📋 Next Steps:"
echo "   1. Update .env with your email credentials"
echo "   2. Restart services: docker-compose restart"
echo "   3. Create your first tenant and users via the Agent dashboard"
echo ""