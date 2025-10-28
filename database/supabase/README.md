# Supabase Migration Files

This directory contains all files needed to migrate the Staff Rota application from MySQL to Supabase (PostgreSQL).

## 📁 Files

### `001_schema.sql`
PostgreSQL schema definition converted from MySQL. This creates all tables, indexes, constraints, and triggers.

**Key Conversions:**
- `AUTO_INCREMENT` → `SERIAL`
- `TINYINT(1)` → `BOOLEAN`
- `ENUM` → PostgreSQL `ENUM` types
- `TIMESTAMP` → `TIMESTAMPTZ` (timezone-aware)
- `ON UPDATE CURRENT_TIMESTAMP` → Trigger functions

**Tables Created:**
1. `config` - Application configuration
2. `buildings` - Building locations
3. `departments` - Departments within buildings
4. `services` - Service areas
5. `shifts` - Shift definitions
6. `staff` - Staff members
7. `staff_allocations` - Staff-to-area assignments
8. `fixed_schedules` - Custom shift times (future feature)
9. `manual_assignments` - Manual shift assignments
10. `staff_absences` - Staff absences
11. `staff_contracted_hours` - Contracted working hours
12. `area_operational_hours` - Operational hours for areas

### `migrate_data.py`
Python script to migrate data from MySQL Docker container to Supabase PostgreSQL.

**Features:**
- Connects to both MySQL and PostgreSQL
- Migrates tables in correct order (respects foreign keys)
- Converts data types automatically
- Resets PostgreSQL sequences after migration
- Verifies row counts match

**Usage:**
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables in .env
SUPABASE_DB_HOST=db.xxx.supabase.co
SUPABASE_DB_PASSWORD=your_password

# Run migration
python migrate_data.py
```

### `requirements.txt`
Python dependencies for the migration script.

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Create new project
3. Note down database credentials

### 2. Run Schema Migration

1. Open Supabase SQL Editor
2. Copy contents of `001_schema.sql`
3. Paste and run

### 3. Run Data Migration

```bash
# From project root
cd database/supabase

# Install Python dependencies
pip install -r requirements.txt

# Create .env file with Supabase credentials
echo "SUPABASE_DB_HOST=db.xxx.supabase.co" >> ../../.env
echo "SUPABASE_DB_PASSWORD=your_password" >> ../../.env

# Run migration
python migrate_data.py
```

### 4. Verify Migration

Check Supabase Table Editor to verify all data was migrated correctly.

## 🔍 Verification Checklist

After migration, verify:

- [ ] All 12 tables exist in Supabase
- [ ] Row counts match MySQL database
- [ ] Foreign key relationships work
- [ ] ENUM types are correct
- [ ] Timestamps are timezone-aware
- [ ] Sequences are set correctly (next ID will be correct)

## 🐛 Troubleshooting

### Connection Failed

**Error**: `psycopg2.OperationalError: could not connect to server`

**Solution**: 
- Check `SUPABASE_DB_HOST` is correct (should be `db.xxx.supabase.co`)
- Check `SUPABASE_DB_PASSWORD` matches your project password
- Ensure your IP is allowed (Supabase allows all IPs by default)

### ENUM Type Errors

**Error**: `invalid input value for enum`

**Solution**:
- PostgreSQL ENUMs are case-sensitive
- Check values in MySQL match ENUM definition exactly
- Common issue: `'day'` vs `'Day'`

### Sequence Not Set

**Error**: Next insert uses ID 1 instead of continuing from max ID

**Solution**:
- Run this SQL in Supabase for each table:
  ```sql
  SELECT setval(pg_get_serial_sequence('table_name', 'id'), 
                (SELECT MAX(id) FROM table_name), true);
  ```

### Row Count Mismatch

**Error**: PostgreSQL has fewer rows than MySQL

**Solution**:
- Check migration script output for errors
- Look for data type conversion issues
- Check for NULL constraint violations
- Re-run migration for specific table

## 📊 Data Type Conversions

| MySQL | PostgreSQL | Notes |
|-------|------------|-------|
| `INT AUTO_INCREMENT` | `SERIAL` | Auto-incrementing integer |
| `TINYINT(1)` | `BOOLEAN` | True/False values |
| `ENUM('a','b')` | `CREATE TYPE ... AS ENUM` | Custom enum type |
| `TIMESTAMP` | `TIMESTAMPTZ` | Timezone-aware timestamp |
| `TIME` | `TIME` | No change |
| `DATE` | `DATE` | No change |
| `VARCHAR(n)` | `VARCHAR(n)` | No change |
| `TEXT` | `TEXT` | No change |

## 🔗 Useful SQL Queries

### Check Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Row Counts
```sql
SELECT 
    schemaname,
    tablename,
    n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Check ENUM Types
```sql
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
ORDER BY t.typname, e.enumsortorder;
```

### Check Foreign Keys
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## 📚 Next Steps

After successful migration:

1. **Update Backend**: Replace MySQL2 with Supabase client
2. **Test Locally**: Verify all API endpoints work with Supabase
3. **Deploy to Vercel**: Deploy backend and frontend
4. **Monitor**: Check Supabase dashboard for query performance
5. **Backup**: Set up automated backups in Supabase settings

## 🆘 Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Migration Guide](../../SUPABASE_VERCEL_MIGRATION.md)

