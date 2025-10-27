-- Migration: Add custom shift times to staff table
-- This allows individual staff members to have custom working hours
-- while still being part of a shift team (e.g., 10:00-22:00 instead of default 08:00-20:00)

ALTER TABLE staff
ADD COLUMN custom_shift_start TIME DEFAULT NULL COMMENT 'Custom shift start time (overrides default shift times)',
ADD COLUMN custom_shift_end TIME DEFAULT NULL COMMENT 'Custom shift end time (overrides default shift times)';

-- Add index for querying staff with custom times
CREATE INDEX idx_staff_custom_times ON staff(custom_shift_start, custom_shift_end);

