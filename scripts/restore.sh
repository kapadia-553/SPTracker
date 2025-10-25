#!/bin/bash

# SP Track Restore Script

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la infrastructure/db/backups/
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring SP Track from backup..."
echo "📁 Backup file: $BACKUP_FILE"

# Confirm restoration
read -p "⚠️  This will overwrite the current database. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 1
fi

# Stop services
echo "🛑 Stopping services..."
docker-compose stop api worker

# Drop and recreate database
echo "🗃️  Recreating database..."
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS sptrack;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE sptrack;"

# Restore from backup
echo "📥 Restoring data..."
if [[ $BACKUP_FILE == *.gz ]]; then
   gunzip -c "$BACKUP_FILE" | docker-compose exec -T postgres psql -U postgres sptrack
else
   docker-compose exec -T postgres psql -U postgres sptrack < "$BACKUP_FILE"
fi

# Restart services
echo "🚀 Restarting services..."
docker-compose start api worker

echo "✅ Restoration complete!"
echo "🌐 Services should be available at:"
echo "   Agent Dashboard: http://localhost:8080"
echo "   Customer Portal: http://localhost:8081"
echo "   API: http://localhost:5000"