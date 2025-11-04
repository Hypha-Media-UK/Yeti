# Database Backups

This directory contains SQL backup files for the Yeti database.

## Manual Backup Instructions

To create a complete backup of the Supabase database, you have two options:

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/zqroxxjfkcmcxryuatex/settings/general
2. Scroll to "Database Backups"
3. Click "Download backup"
4. Save the file to this directory

### Option 2: Using pg_dump (Advanced)
If you have direct database access:

```bash
pg_dump -h db.zqroxxjfkcmcxryuatex.supabase.co \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -f yeti_backup_$(date +%Y%m%d).sql
```

### Option 3: Using Supabase CLI
```bash
# Login to Supabase
supabase login

# Create backup
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.zqroxxjfkcmcxryuatex.supabase.co:5432/postgres" -f yeti_backup_$(date +%Y%m%d).sql --use-copy
```

## Restore Instructions

To restore a backup:

```bash
psql -h db.zqroxxjfkcmcxryuatex.supabase.co \
  -U postgres \
  -d postgres \
  -f yeti_backup_YYYYMMDD.sql
```

## Backup Schedule

- **Automatic**: Supabase provides daily backups (retained for 7 days on free tier)
- **Manual**: Create backups before major changes or deployments
