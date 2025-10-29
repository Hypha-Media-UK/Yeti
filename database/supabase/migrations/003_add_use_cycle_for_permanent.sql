-- Migration: Add use_cycle_for_permanent flag to staff table
-- This allows permanently assigned staff to use cycle-based calculations
-- instead of contracted hours for determining working days

-- Add the new column
ALTER TABLE staff
ADD COLUMN use_cycle_for_permanent BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN staff.use_cycle_for_permanent IS 
'If true, permanently assigned staff (shift_id = NULL) use cycle_type and days_offset to determine working days instead of contracted_hours. Useful for staff who work a regular 4-on-4-off rotation but are permanently assigned to specific areas.';

-- Create index for querying staff with this flag
CREATE INDEX idx_staff_use_cycle_for_permanent ON staff(use_cycle_for_permanent) WHERE use_cycle_for_permanent = TRUE;

-- Migration notes:
-- 1. Default is FALSE to maintain existing behavior for current permanent staff
-- 2. When TRUE and shift_id is NULL, the system will use cycle_type and days_offset
-- 3. When FALSE and shift_id is NULL, the system will use contracted_hours (existing behavior)
-- 4. This flag is only relevant when shift_id is NULL (permanent assignments)

