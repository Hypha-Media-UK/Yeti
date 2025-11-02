-- Migration: Make Supervisors First-Class Citizens
-- Purpose: Simplify supervisor configuration by removing dependency on shift entity
-- Date: 2025-11-02
--
-- RATIONALE:
-- Supervisors don't actually belong to "shift groups" like regular staff.
-- They work independently on a 16-day cycle and appear with whichever shift is working.
-- Forcing them into the shift model creates unnecessary complexity:
--   - Complex getSupervisorRegularShiftOffset() mapping function
--   - Confusing "create supervisor shift first" configuration step
--   - Dual offset system (shift offset + personal offset)
--   - Special-case logic throughout the codebase
--
-- SOLUTION:
-- Add supervisor_offset column to staff table for supervisors only.
-- Regular staff continue using shift_id + optional personal offset.
-- Supervisors use supervisor_offset directly in their 16-day cycle.
--
-- ============================================================================
-- PART 1: Add supervisor_offset column
-- ============================================================================

ALTER TABLE staff
ADD COLUMN supervisor_offset INTEGER CHECK (supervisor_offset IN (0, 4, 8, 12));

COMMENT ON COLUMN staff.supervisor_offset IS 
'For supervisors only: Position in the 16-day supervisor cycle (0, 4, 8, or 12). 
Determines which 4-day working block the supervisor is assigned to.
- Offset 0: Works days 7-10 (positions in cycle), nights 15-2
- Offset 4: Works days 11-14 (positions in cycle), nights 3-6  
- Offset 8: Works days 15-2 (positions in cycle), nights 7-10
- Offset 12: Works days 3-6 (positions in cycle), nights 11-14
NULL for non-supervisor staff.';

-- Create index for supervisor offset lookups
CREATE INDEX idx_staff_supervisor_offset ON staff(supervisor_offset) WHERE supervisor_offset IS NOT NULL;

-- ============================================================================
-- PART 2: Migrate existing supervisor data
-- ============================================================================

-- Migrate supervisors: Move days_offset to supervisor_offset, clear shift_id
UPDATE staff
SET 
    supervisor_offset = days_offset,
    shift_id = NULL,
    days_offset = 0
WHERE status = 'Supervisor' AND days_offset IS NOT NULL;

-- Handle any supervisors with days_offset = NULL (default to 0)
UPDATE staff
SET 
    supervisor_offset = 0,
    shift_id = NULL,
    days_offset = 0
WHERE status = 'Supervisor' AND supervisor_offset IS NULL;

-- ============================================================================
-- PART 3: Add validation constraint
-- ============================================================================

-- Ensure supervisors use supervisor_offset, not shift_id
-- (We'll enforce this in application code, but document it here)

COMMENT ON COLUMN staff.shift_id IS 
'For Regular staff only: References the shift group (Day Shift A, Day Shift B, etc.) this staff belongs to.
For pool staff (is_pool_staff = true): The shift they are assigned to.
For permanent staff: NULL (they use reference_shift_id instead).
For Supervisors: Should always be NULL (supervisors use supervisor_offset instead).
For Relief: NULL (manual assignments only).';

COMMENT ON COLUMN staff.days_offset IS 
'Personal offset from the shift''s base offset (for Regular staff only).
If non-zero, this overrides the shift''s days_offset for this specific staff member.
Allows individual staff to be offset within their shift group.
For Supervisors: Should be 0 (supervisors use supervisor_offset instead).';

-- ============================================================================
-- PART 4: Optional cleanup - Remove supervisor shifts
-- ============================================================================

-- NOTE: This step is optional and commented out by default.
-- Uncomment if you want to remove supervisor shifts from the shifts table.
-- Only do this if you're certain no other data depends on these shifts.

-- List supervisor shifts for review:
-- SELECT id, name, type, cycle_type, cycle_length, days_offset 
-- FROM shifts 
-- WHERE cycle_type = '16-day-supervisor';

-- To delete supervisor shifts (UNCOMMENT CAREFULLY):
-- DELETE FROM shifts WHERE cycle_type = '16-day-supervisor';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify migration:
-- 1. Check all supervisors have supervisor_offset set
-- SELECT id, first_name, last_name, status, supervisor_offset, shift_id, days_offset
-- FROM staff
-- WHERE status = 'Supervisor';

-- 2. Check no supervisors have shift_id set
-- SELECT COUNT(*) as should_be_zero
-- FROM staff
-- WHERE status = 'Supervisor' AND shift_id IS NOT NULL;

-- 3. Check all supervisors have days_offset = 0
-- SELECT COUNT(*) as should_be_zero
-- FROM staff
-- WHERE status = 'Supervisor' AND days_offset != 0;

-- 4. Verify supervisor offset distribution
-- SELECT supervisor_offset, COUNT(*) as count
-- FROM staff
-- WHERE status = 'Supervisor'
-- GROUP BY supervisor_offset
-- ORDER BY supervisor_offset;

