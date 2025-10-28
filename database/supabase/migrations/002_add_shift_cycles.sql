-- Migration: Add shift cycle fields to support shift-based offsets
-- This migration adds cycle information to shifts table and links staff to shifts
-- Goal: Solve performance issues by querying only staff in active shifts

-- ============================================================================
-- PART 1: Add cycle fields to shifts table
-- ============================================================================

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS cycle_type VARCHAR(50),      -- '4-on-4-off', '16-day-supervisor', 'relief', 'fixed'
ADD COLUMN IF NOT EXISTS cycle_length INTEGER,        -- 8, 16, null for relief/fixed
ADD COLUMN IF NOT EXISTS days_offset INTEGER DEFAULT 0;

COMMENT ON COLUMN shifts.cycle_type IS 'Type of rotation cycle: 4-on-4-off, 16-day-supervisor, relief, fixed';
COMMENT ON COLUMN shifts.cycle_length IS 'Length of the cycle in days (8 for regular, 16 for supervisor, null for relief/fixed)';
COMMENT ON COLUMN shifts.days_offset IS 'Offset from app_zero_date for this shift group';

-- ============================================================================
-- PART 2: Add shift_id to staff table (nullable for migration)
-- ============================================================================

-- Note: We keep days_offset on staff table temporarily for rollback safety
-- It will be removed in a future migration after verification

-- shift_id is nullable to allow gradual migration
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS shift_id INTEGER REFERENCES shifts(id);

CREATE INDEX IF NOT EXISTS idx_staff_shift_id ON staff(shift_id);

COMMENT ON COLUMN staff.shift_id IS 'Primary shift assignment - determines when staff work based on shift cycle';

-- ============================================================================
-- PART 3: Create new shift groups based on existing data patterns
-- ============================================================================

-- Update existing shifts with cycle information
UPDATE shifts SET 
  cycle_type = '4-on-4-off',
  cycle_length = 8,
  days_offset = 0
WHERE name = 'Day Shift' AND type = 'day';

UPDATE shifts SET 
  cycle_type = '4-on-4-off',
  cycle_length = 8,
  days_offset = 0
WHERE name = 'Night Shift' AND type = 'night';

-- Create additional shift groups for different offsets
-- Based on data analysis: offset 0 (55), offset 4 (15), offset 2 (6), offset 3 (2), offset 6 (1)

-- Day Shift B (offset 4) - 10 staff
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Day Shift B', 'day', '#DBEAFE', '4-on-4-off day shift (offset 4)', '4-on-4-off', 8, 4, true)
ON CONFLICT DO NOTHING;

-- Day Shift C (offset 2) - 4 staff
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Day Shift C', 'day', '#BFDBFE', '4-on-4-off day shift (offset 2)', '4-on-4-off', 8, 2, true)
ON CONFLICT DO NOTHING;

-- Day Shift D (offset 3) - 1 staff
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Day Shift D', 'day', '#93C5FD', '4-on-4-off day shift (offset 3)', '4-on-4-off', 8, 3, true)
ON CONFLICT DO NOTHING;

-- Day Shift E (offset 6) - 1 staff
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Day Shift E', 'day', '#60A5FA', '4-on-4-off day shift (offset 6)', '4-on-4-off', 8, 6, true)
ON CONFLICT DO NOTHING;

-- Night Shift B (offset 4) - 4 staff
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Night Shift B', 'night', '#DDD6FE', '4-on-4-off night shift (offset 4)', '4-on-4-off', 8, 4, true)
ON CONFLICT DO NOTHING;

-- Night Shift C (offset 2) - 1 staff
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Night Shift C', 'night', '#C4B5FD', '4-on-4-off night shift (offset 2)', '4-on-4-off', 8, 2, true)
ON CONFLICT DO NOTHING;

-- Night Shift D (offset 3) - 1 staff
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Night Shift D', 'night', '#A78BFA', '4-on-4-off night shift (offset 3)', '4-on-4-off', 8, 3, true)
ON CONFLICT DO NOTHING;

-- Supervisor Shift A (offset 0) - 1 staff
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Supervisor Shift A', 'day', '#FDE68A', '16-day supervisor rotation (offset 0)', '16-day-supervisor', 16, 0, true)
ON CONFLICT DO NOTHING;

-- Relief Pool (no cycle, manual assignments only)
INSERT INTO shifts (name, type, color, description, cycle_type, cycle_length, days_offset, is_active)
VALUES ('Relief Pool', 'day', '#D1D5DB', 'Relief staff - manual assignments only', 'relief', null, 0, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 4: Assign staff to shifts based on their current offset and type
-- ============================================================================

-- Note: We use the existing shift_id column to determine if staff are currently
-- assigned to day or night shifts, then assign them to the appropriate offset group

-- Assign Regular Day staff with offset 0 to Day Shift
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Day Shift' AND type = 'day')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 0
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'day';

-- Assign Regular Day staff with offset 4 to Day Shift B
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Day Shift B' AND type = 'day')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 4
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'day';

-- Assign Regular Day staff with offset 2 to Day Shift C
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Day Shift C' AND type = 'day')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 2
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'day';

-- Assign Regular Day staff with offset 3 to Day Shift D
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Day Shift D' AND type = 'day')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 3
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'day';

-- Assign Regular Day staff with offset 6 to Day Shift E
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Day Shift E' AND type = 'day')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 6
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'day';

-- Assign Regular Night staff with offset 0 to Night Shift
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Night Shift' AND type = 'night')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 0
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'night';

-- Assign Regular Night staff with offset 4 to Night Shift B
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Night Shift B' AND type = 'night')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 4
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'night';

-- Assign Regular Night staff with offset 2 to Night Shift C
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Night Shift C' AND type = 'night')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 2
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'night';

-- Assign Regular Night staff with offset 3 to Night Shift D
UPDATE staff
SET shift_id = (SELECT id FROM shifts WHERE name = 'Night Shift D' AND type = 'night')
FROM shifts old_shift
WHERE staff.status = 'Regular'
  AND staff.days_offset = 3
  AND staff.shift_id = old_shift.id
  AND old_shift.type = 'night';

-- Assign Supervisor staff to Supervisor Shift A
UPDATE staff 
SET shift_id = (SELECT id FROM shifts WHERE name = 'Supervisor Shift A')
WHERE status = 'Supervisor' 
  AND shift_id IS NULL
  AND days_offset = 0;

-- Assign Relief staff to Relief Pool
UPDATE staff 
SET shift_id = (SELECT id FROM shifts WHERE name = 'Relief Pool')
WHERE status = 'Relief' 
  AND shift_id IS NULL;

-- ============================================================================
-- PART 5: Handle staff with null shift_id (no shift assigned yet)
-- ============================================================================

-- For Regular staff with null shift_id, assign to Day Shift (default)
UPDATE staff 
SET shift_id = (SELECT id FROM shifts WHERE name = 'Day Shift' AND type = 'day')
WHERE status = 'Regular' 
  AND shift_id IS NULL
  AND days_offset = 0;

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration to verify)
-- ============================================================================

-- Check shift distribution
-- SELECT s.name, s.type, s.cycle_type, s.days_offset, COUNT(st.id) as staff_count
-- FROM shifts s
-- LEFT JOIN staff st ON st.shift_id = s.id AND st.is_active = true
-- GROUP BY s.id, s.name, s.type, s.cycle_type, s.days_offset
-- ORDER BY s.type, s.days_offset;

-- Check for staff without shift assignment
-- SELECT id, first_name, last_name, status, days_offset
-- FROM staff
-- WHERE is_active = true AND shift_id IS NULL;

