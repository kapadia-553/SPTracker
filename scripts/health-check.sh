#!/bin/bash

# SP Track Health Check Script

echo "🏥 SP Track Health Check"
echo "========================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "✅ Docker is running"

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🔍 Health Checks:"

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL is not responding"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is not responding"
fi

# Check MinIO
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO is healthy"
else
    echo "❌ MinIO is not responding"
fi

# Check API
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API is not responding"
fi

# Check Agent Dashboard
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Agent Dashboard is healthy"
else
    echo "❌ Agent Dashboard is not responding"
fi

# Check Customer Portal
if curl -f http://localhost:8081 > /dev/null 2>&1; then
    echo "✅ Customer Portal is healthy"
else
    echo "❌ Customer Portal is not responding"
fi

echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "📝 Recent Logs (last 10 lines):"
echo "API Logs:"
docker-compose logs --tail=5 api

echo ""
echo "Worker Logs:"
docker-compose logs --tail=5 worker