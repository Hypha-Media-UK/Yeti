# Database Backup - 2025-10-31 (Pre-Refactoring)

**Created**: 2025-10-31 00:24:45  
**Purpose**: Complete database backup before architectural refactoring  
**Supabase Project**: zqroxxjfkcmcxryuatex (EU-West-2)

## Summary

This backup captures the complete state of the Yeti rota management system database before implementing architectural improvements. The system is currently working with:

- **90 staff members** (including 2 pool staff: James Bennett #25, Mark Walton #41)
- **30 shifts** (Day/Night shifts with 4-on-4-off and 16-day supervisor cycles)
- **66 departments** across 16 buildings
- **9 services** (Patient Transport, Medical Records, Blood Drivers, etc.)
- **Pool staff functionality** recently implemented and working

## Key Features Currently Working

1. ✅ 4-on-4-off shift cycles for regular staff
2. ✅ 16-day supervisor rotation
3. ✅ Pool staff with contracted hours (James Bennett, Mark Walton)
4. ✅ Manual assignments and temporary area assignments
5. ✅ Staff absences tracking
6. ✅ Contracted hours for non-shift-based staff
7. ✅ Permanent area allocations

## Database Schema

### Tables
- `config` - Application configuration (app_zero_date, time_zone)
- `buildings` - 16 buildings
- `departments` - 66 departments
- `services` - 9 services
- `shifts` - 30 shift definitions
- `staff` - 90 staff members
- `staff_allocations` - Permanent area assignments
- `staff_contracted_hours` - Day-specific working hours
- `manual_assignments` - Temporary assignments and overrides
- `staff_absences` - Absence tracking
- `fixed_schedules` - Custom shift times (future feature)
- `area_operational_hours` - Operational hours for areas

## Configuration

```yaml
app_zero_date: "2025-10-26"
time_zone: "Europe/London"
```

## Recent Changes

### Commit: 3730925 - Pool Staff Feature
- Added `is_pool_staff` column to staff table
- Added pool staff processing logic in rota service
- Marked James Bennett (ID 25) and Mark Walton (ID 41) as pool staff
- Pool staff appear in shift panels but work contracted hours

### Commit: fdfd675 - Pool Staff Duplication Fix
- Fixed bug where pool staff appeared twice in rota
- Added check to skip pool staff in main shift loop

## Critical Data Points

### Pool Staff Configuration
- **James Bennett (ID 25)**:
  - `is_pool_staff = true`
  - `use_contracted_hours_for_shift = true`
  - `shift_id = 1` (Day Shift A - for categorization only)
  - Works: Tue/Wed/Thu 06:00-14:00

- **Mark Walton (ID 41)**:
  - `is_pool_staff = true`
  - `use_contracted_hours_for_shift = false`
  - `shift_id = 1` (Day Shift A - for categorization only)
  - Works: Mon-Fri 06:00-14:00

### Active Shifts
- Day Shift A (ID 1): offset 0
- Night Shift A (ID 2): offset 0
- Day Shift B (ID 16): offset 4
- Night Shift B (ID 20): offset 4
- Supervisor Shift A (ID 23): 16-day cycle, offset 8
- Supervisor Shift B (ID 14): 16-day cycle, offset 8
- PTS shifts (IDs 25, 26, 29, 30): Various offsets

## Restoration Instructions

If you need to restore this backup:

1. **Schema Restoration**:
   ```bash
   # Apply the schema from database/supabase/001_schema.sql
   psql -h [supabase-host] -U postgres -d postgres -f database/supabase/001_schema.sql
   ```

2. **Data Restoration**:
   - All table data is documented in this file
   - Use Supabase SQL Editor to restore data
   - Or use the Supabase Management API

3. **Verify Critical Features**:
   - Test pool staff appear correctly on rota
   - Verify shift cycles calculate correctly
   - Check manual assignments work
   - Confirm contracted hours are respected

## Notes

- This backup was created before implementing architectural improvements
- The system is currently stable and working
- Pool staff feature is the most recent addition
- All tests passing as of this backup

## Full Data Export

Complete data for all tables is available via Supabase Management API.
Use the following queries to export:

```sql
-- Config
SELECT * FROM config;

-- Buildings (16 total)
SELECT * FROM buildings ORDER BY id;

-- Departments (66 total)
SELECT * FROM departments ORDER BY id;

-- Services (9 total)
SELECT * FROM services ORDER BY id;

-- Shifts (30 total)
SELECT * FROM shifts ORDER BY id;

-- Staff (90 total)
SELECT * FROM staff ORDER BY id;

-- Staff Allocations
SELECT * FROM staff_allocations ORDER BY id;

-- Contracted Hours
SELECT * FROM staff_contracted_hours ORDER BY id;

-- Manual Assignments
SELECT * FROM manual_assignments ORDER BY id;

-- Absences
SELECT * FROM staff_absences ORDER BY id;
```

---

**End of Backup Document**

