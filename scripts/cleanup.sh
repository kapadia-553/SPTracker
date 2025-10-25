#!/bin/bash

# SP Track Cleanup Script

echo "🧹 Cleaning up SP Track..."

# Stop and remove all containers
echo "🛑 Stopping Docker containers..."
docker-compose down

# Remove Docker volumes (WARNING: This will delete all data!)
read -p "⚠️  Do you want to remove all data volumes? This cannot be undone! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing Docker volumes..."
    docker-compose down -v
    docker volume prune -f
fi

# Remove Docker images
read -p "🗑️  Do you want to remove Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing Docker images..."
    docker-compose down --rmi all
fi

# Clean backend build artifacts
echo "🧹 Cleaning .NET build artifacts..."
find backend -name "bin" -type d -exec rm -rf {} + 2>/dev/null || true
find backend -name "obj" -type d -exec rm -rf {} + 2>/dev/null || true

# Clean frontend build artifacts
echo "🧹 Cleaning Angular build artifacts..."
rm -rf frontend/dist
rm -rf frontend/node_modules
rm -rf frontend/.angular

# Clean logs
echo "🧹 Cleaning logs..."
rm -rf backend/logs/*

echo "✅ Cleanup complete!"