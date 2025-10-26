# Database Backups

This directory contains database backups for the Staff Rota application.

## Creating a Backup

To create a new backup, run:

```bash
docker exec staff_rota_mysql mysqldump -u root -proot_password staff_rota > database/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

## Restoring from a Backup

To restore from a backup file:

```bash
docker exec -i staff_rota_mysql mysql -u root -proot_password staff_rota < database/backups/backup_YYYYMMDD_HHMMSS.sql
```

Replace `backup_YYYYMMDD_HHMMSS.sql` with the actual backup filename.

## Backup Contents

Each backup includes:
- All table structures (buildings, departments, staff, manual_assignments)
- All data from these tables
- Foreign key relationships
- Indexes and constraints

## Notes

- Backup files are excluded from git (see `.gitignore`)
- Backups are timestamped with format: `backup_YYYYMMDD_HHMMSS.sql`
- Keep regular backups before major changes
- Test restore process periodically to ensure backups are valid

