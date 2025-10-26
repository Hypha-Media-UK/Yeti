# Database Migration Guide

This document explains the database migration history and provides guidance for fresh installations vs. upgrading existing databases.

## Migration History

The application has 14 migrations that track the evolution of the database schema:

| # | Migration | Purpose | Status |
|---|-----------|---------|--------|
| 001 | `create_config_table.sql` | App configuration (zero date, timezone) | ✅ Active |
| 002 | `create_staff_table.sql` | Core staff data | ✅ Active |
| 003 | `create_fixed_schedules_table.sql` | Fixed schedules (future feature) | ⚠️ Planned |
| 004 | `create_manual_assignments_table.sql` | Manual shift overrides | ✅ Active |
| 005 | `create_buildings_table.sql` | Building locations | ✅ Active |
| 006 | `create_departments_table.sql` | Departments within buildings | ✅ Active |
| 007 | `add_department_to_staff.sql` | Add department_id FK | 🔄 Legacy |
| 008 | `create_services_table.sql` | Service areas | ✅ Active |
| 009 | `add_service_to_staff.sql` | Add service_id FK | 🔄 Legacy |
| 010 | `create_staff_allocations_table.sql` | Many-to-many allocations | ✅ Active |
| 011 | `migrate_existing_allocations.sql` | Migrate data to new table | 🔄 Legacy |
| 012 | `remove_legacy_allocation_columns.sql` | Remove old FKs | 🔄 Legacy |
| 013 | `create_area_operational_hours_table.sql` | Operational hours | ✅ Active |
| 014 | `create_staff_contracted_hours_table.sql` | Contracted hours | ✅ Active |

### Legend
- ✅ **Active** - Currently used in production
- ⚠️ **Planned** - Schema exists but feature not implemented
- 🔄 **Legacy** - Part of refactoring journey, needed for existing databases

## Understanding the Legacy Migrations

### The Allocation Refactoring (Migrations 007-012)

**Original Design (Migrations 007-009):**
- Staff could belong to ONE department OR ONE service
- Used foreign keys: `staff.department_id` and `staff.service_id`
- Limitation: Staff couldn't work in multiple areas

**New Design (Migrations 010-012):**
- Staff can be allocated to MULTIPLE departments AND/OR services
- Uses many-to-many table: `staff_allocations`
- Flexible: Supports complex allocation patterns

**Migration Path:**
1. **007** - Add `department_id` column to staff
2. **009** - Add `service_id` column to staff
3. **010** - Create `staff_allocations` table
4. **011** - Copy data from old columns to new table
5. **012** - Remove old columns

**Why keep legacy migrations?**
- Existing databases need the full migration path
- Provides audit trail of schema evolution
- Ensures data is properly migrated without loss

## Fresh Installation

For **new installations** (no existing data), you can run all migrations in order:

```bash
# From project root
cd database/migrations
for file in *.sql; do
  docker exec -i staff_rota_mysql mysql -u root -proot_password staff_rota < "$file"
done
```

The legacy migrations (007, 009, 011, 012) will execute but have minimal impact since there's no data to migrate.

### Alternative: Consolidated Schema

For fresh installations, you could create a consolidated schema that skips the legacy migrations:

**Option 1: Use all migrations (recommended)**
- Pros: Consistent with production databases
- Cons: Includes unnecessary steps for fresh install

**Option 2: Create consolidated schema**
- Pros: Cleaner for fresh installs
- Cons: Diverges from production migration history
- **Not currently implemented** - would require creating new migration set

## Upgrading Existing Database

For **existing databases**, always run migrations in order:

```bash
# Check current migration status
docker exec staff_rota_mysql mysql -u root -proot_password staff_rota -e "SHOW TABLES;"

# Run missing migrations
# Example: If you're on migration 010, run 011, 012, 013, 014
docker exec -i staff_rota_mysql mysql -u root -proot_password staff_rota < database/migrations/011_migrate_existing_allocations.sql
docker exec -i staff_rota_mysql mysql -u root -proot_password staff_rota < database/migrations/012_remove_legacy_allocation_columns.sql
docker exec -i staff_rota_mysql mysql -u root -proot_password staff_rota < database/migrations/013_create_area_operational_hours_table.sql
docker exec -i staff_rota_mysql mysql -u root -proot_password staff_rota < database/migrations/014_create_staff_contracted_hours_table.sql
```

### Migration Safety

**Before running migrations:**
1. ✅ **Backup your database** (see Backup section below)
2. ✅ **Test on staging environment** first
3. ✅ **Review migration SQL** to understand changes
4. ✅ **Check for data dependencies**

**After running migrations:**
1. ✅ **Verify data integrity**
2. ✅ **Test application functionality**
3. ✅ **Monitor for errors**

## Backup and Restore

### Create Backup

```bash
# Create timestamped backup
docker exec staff_rota_mysql mysqldump -u root -proot_password staff_rota > database/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file
ls -lh database/backups/
```

### Restore from Backup

```bash
# Restore from specific backup
docker exec -i staff_rota_mysql mysql -u root -proot_password staff_rota < database/backups/backup_20250126_120000.sql

# Verify restoration
docker exec staff_rota_mysql mysql -u root -proot_password staff_rota -e "SELECT COUNT(*) FROM staff;"
```

## Migration Tracking

Currently, migrations are tracked manually. Consider implementing a migration tracking system:

### Option 1: Migration Table

```sql
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Option 2: Use Migration Tool

Consider using a migration tool like:
- **Flyway** (Java-based, works with any DB)
- **Liquibase** (XML/YAML based)
- **node-pg-migrate** (Node.js, PostgreSQL)
- **Knex.js** (Node.js, multiple DBs)

## Rollback Strategy

**Important:** Not all migrations are easily reversible!

### Reversible Migrations
- Adding columns (can drop)
- Adding indexes (can drop)
- Creating tables (can drop if no data)

### Non-Reversible Migrations
- **011** - Data migration (can't easily undo)
- **012** - Dropping columns (data loss if rolled back)

**Recommendation:** Always backup before migrations. Rollback by restoring from backup.

## Future Migrations

When creating new migrations:

1. **Naming Convention:** `###_description.sql` (e.g., `015_add_leave_table.sql`)
2. **Include Comments:** Explain purpose and any special considerations
3. **Test Thoroughly:** Test on fresh DB and existing DB
4. **Document Changes:** Update this guide and FEATURE_STATUS.md
5. **Backup First:** Always backup before applying to production

### Example Migration Template

```sql
-- Migration 015: Add leave management table
-- Purpose: Track staff leave/absence
-- Dependencies: Requires staff table (migration 002)
-- Reversible: Yes (can drop table if no data)

CREATE TABLE IF NOT EXISTS staff_leave (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    leave_type ENUM('annual', 'sick', 'unpaid') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    INDEX idx_staff_dates (staff_id, start_date, end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Troubleshooting

### Migration Fails

**Error: Table already exists**
```sql
-- Check if table exists
SHOW TABLES LIKE 'table_name';

-- If exists, migration may have partially run
-- Review migration and manually complete or rollback
```

**Error: Foreign key constraint fails**
```sql
-- Check existing constraints
SELECT * FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'staff_rota' AND TABLE_NAME = 'your_table';

-- May need to drop constraint first
ALTER TABLE your_table DROP FOREIGN KEY constraint_name;
```

### Data Inconsistencies

After migration 011 (allocation migration), verify data:

```sql
-- Check all staff have allocations
SELECT s.id, s.name, COUNT(sa.id) as allocation_count
FROM staff s
LEFT JOIN staff_allocations sa ON s.id = sa.staff_id
WHERE s.is_active = 1
GROUP BY s.id, s.name
HAVING allocation_count = 0;

-- Should return no rows if all staff are allocated
```

## Best Practices

1. ✅ **Version Control** - All migrations in git
2. ✅ **Sequential Numbering** - Never skip numbers
3. ✅ **Idempotent** - Use `IF NOT EXISTS` where possible
4. ✅ **Documented** - Clear comments in SQL
5. ✅ **Tested** - Test on fresh and existing DBs
6. ✅ **Backed Up** - Always backup before migrations
7. ✅ **Reversible** - Document rollback procedure
8. ✅ **Atomic** - Each migration should be self-contained

## References

- [MySQL Migration Best Practices](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)
- [Database Refactoring](https://www.martinfowler.com/books/refactoringDatabases.html)
- [Flyway Documentation](https://flywaydb.org/documentation/)

