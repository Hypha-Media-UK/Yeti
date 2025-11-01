-- Migration: Add early_finish_day to staff table
-- Purpose: Track which day of a staff member's 4-day cycle they finish early
-- Values: 1-4 (day 1, 2, 3, or 4 of their cycle), NULL if no early finish

ALTER TABLE staff
ADD COLUMN early_finish_day INTEGER CHECK (early_finish_day >= 1 AND early_finish_day <= 4);

COMMENT ON COLUMN staff.early_finish_day IS 
'Which day of the staff member''s 4-day cycle they finish early (1-4). NULL if no early finish. Day shifts finish at 19:00 instead of 20:00, night shifts finish at 07:00 instead of 08:00.';

-- Create index for querying staff with early finishes
CREATE INDEX idx_staff_early_finish_day ON staff(early_finish_day) WHERE early_finish_day IS NOT NULL;

