# 🚀 Data Migration - Quick Start Guide

## ✅ What's Already Done

1. ✅ **Supabase Project Created**: "Yeti" (ID: zqroxxjfkcmcxryuatex)
2. ✅ **PostgreSQL Schema Created**: All 12 tables, indexes, triggers, and ENUM types
3. ✅ **Environment Variables Set**: `.env` file updated with Supabase credentials

## 📋 What You Need to Do Now

### **Step 1: Ensure MySQL Docker is Running**

```bash
# Check if MySQL container is running
docker-compose ps mysql

# If not running, start it
docker-compose up -d mysql
```

### **Step 2: Install Python Dependencies**

```bash
# Install required Python packages
pip install -r database/supabase/requirements.txt
```

Or install individually:
```bash
pip install mysql-connector-python==8.2.0
pip install psycopg2-binary==2.9.9
pip install python-dotenv==1.0.0
```

### **Step 3: Run the Data Migration Script**

```bash
# Navigate to the migration directory
cd database/supabase

# Run the migration script
python migrate_data.py
```

### **Expected Output:**

```
============================================================
MySQL to Supabase PostgreSQL Migration
============================================================
✓ Connected to MySQL: staff_rota
✓ Connected to Supabase PostgreSQL

📦 Migrating table: config
  Found 2 rows
  ✓ Migrated 2 rows

📦 Migrating table: buildings
  Found 16 rows
  ✓ Migrated 16 rows

📦 Migrating table: departments
  Found 66 rows
  ✓ Migrated 66 rows

📦 Migrating table: services
  Found 9 rows
  ✓ Migrated 9 rows

📦 Migrating table: shifts
  Found 2 rows
  ✓ Migrated 2 rows

📦 Migrating table: staff
  Found 90 rows
  ✓ Migrated 90 rows

📦 Migrating table: staff_allocations
  Found XXX rows
  ✓ Migrated XXX rows

📦 Migrating table: fixed_schedules
  ⚠ No data to migrate

📦 Migrating table: manual_assignments
  Found XXX rows
  ✓ Migrated XXX rows

📦 Migrating table: staff_absences
  Found XXX rows
  ✓ Migrated XXX rows

📦 Migrating table: staff_contracted_hours
  Found XXX rows
  ✓ Migrated XXX rows

📦 Migrating table: area_operational_hours
  Found XXX rows
  ✓ Migrated XXX rows

🔍 Verifying migration...
  ✓ config: MySQL=2, PostgreSQL=2
  ✓ buildings: MySQL=16, PostgreSQL=16
  ✓ departments: MySQL=66, PostgreSQL=66
  ✓ services: MySQL=9, PostgreSQL=9
  ✓ shifts: MySQL=2, PostgreSQL=2
  ✓ staff: MySQL=90, PostgreSQL=90
  ✓ staff_allocations: MySQL=XXX, PostgreSQL=XXX
  ✓ fixed_schedules: MySQL=0, PostgreSQL=0
  ✓ manual_assignments: MySQL=XXX, PostgreSQL=XXX
  ✓ staff_absences: MySQL=XXX, PostgreSQL=XXX
  ✓ staff_contracted_hours: MySQL=XXX, PostgreSQL=XXX
  ✓ area_operational_hours: MySQL=XXX, PostgreSQL=XXX

✅ Migration completed successfully!

============================================================
```

## 🔍 Verify Migration in Supabase

1. Go to https://supabase.com/dashboard/project/zqroxxjfkcmcxryuatex
2. Click **Table Editor** in the left sidebar
3. Check each table has data:
   - `config` - should have 2 rows
   - `buildings` - should have 16 rows
   - `departments` - should have 66 rows
   - `services` - should have 9 rows
   - `shifts` - should have 2 rows
   - `staff` - should have ~90 rows
   - etc.

## 🐛 Troubleshooting

### Error: "MySQL connection failed"

**Solution**: Make sure MySQL Docker container is running:
```bash
docker-compose up -d mysql
docker-compose logs mysql
```

### Error: "PostgreSQL connection failed"

**Solution**: Check `.env` file has correct Supabase credentials:
- `SUPABASE_DB_HOST=db.zqroxxjfkcmcxryuatex.supabase.co`
- `SUPABASE_DB_PASSWORD=YetiStaffRota2025!SecureDB#Migration`

### Error: "No module named 'mysql.connector'"

**Solution**: Install Python dependencies:
```bash
pip install -r database/supabase/requirements.txt
```

### Error: "Row counts don't match"

**Solution**: Check migration script output for specific table errors. You can re-run the migration script - it will skip existing data.

## 📞 Next Steps

Once the data migration is complete:

1. ✅ Verify all data in Supabase Table Editor
2. ✅ Let me know it's complete
3. ✅ I'll proceed with backend code updates
4. ✅ Then we'll deploy to Vercel

## 🔐 Important Credentials

**Supabase Project**: Yeti
- **Project URL**: https://zqroxxjfkcmcxryuatex.supabase.co
- **Database Host**: db.zqroxxjfkcmcxryuatex.supabase.co
- **Database Password**: `YetiStaffRota2025!SecureDB#Migration`
- **Anon Key**: (in `.env` file)
- **Service Role Key**: (in `.env` file - keep secret!)

**Save these credentials securely!** You'll need them for the backend configuration.

---

**Ready?** Run the migration script and let me know when it's done! 🚀

