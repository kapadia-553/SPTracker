#!/bin/bash

# SP Track Backup Script

BACKUP_DIR="infrastructure/db/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="sptrack_backup_${TIMESTAMP}.sql"

echo "💾 Creating SP Track backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
echo "🗃️  Backing up database..."
docker-compose exec -T postgres pg_dump -U postgres sptrack > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress the backup
echo "🗜️  Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
echo "📁 Backup size: $(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)"