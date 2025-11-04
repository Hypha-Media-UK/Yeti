#!/bin/bash

# Database Backup Script for Yeti Supabase Database
# This script creates a complete backup of the database including schema and data

# Configuration
PROJECT_REF="zqroxxjfkcmcxryuatex"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/yeti_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "Yeti Database Backup"
echo "=========================================="
echo "Project: ${PROJECT_REF}"
echo "Timestamp: ${TIMESTAMP}"
echo "Backup file: ${BACKUP_FILE}"
echo "=========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "Error: Not logged in to Supabase CLI."
    echo "Please run: supabase login"
    exit 1
fi

echo "Creating database backup..."
echo ""

# Get database connection string from Supabase
# You'll need to set your database password as an environment variable: SUPABASE_DB_PASSWORD
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "Error: SUPABASE_DB_PASSWORD environment variable is not set."
    echo "Please set it with: export SUPABASE_DB_PASSWORD='your-password'"
    exit 1
fi

DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"
DB_URL="postgresql://${DB_USER}:${SUPABASE_DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}"

# Use Supabase CLI to create a database dump
# This will include all schemas, tables, data, functions, triggers, etc.
supabase db dump --db-url "$DB_URL" -f "$BACKUP_FILE" --use-copy

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Backup completed successfully!"
    echo "=========================================="
    echo "Backup file: ${BACKUP_FILE}"
    echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo ""
    echo "To restore this backup, use:"
    echo "  psql -h <host> -U <user> -d <database> -f ${BACKUP_FILE}"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ Backup failed!"
    echo "=========================================="
    exit 1
fi

