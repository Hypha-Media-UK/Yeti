-- Enhance manual_assignments table to support temporary area assignments
-- This allows pool staff to be temporarily assigned to specific areas with time ranges

-- Add area assignment fields
ALTER TABLE manual_assignments
ADD COLUMN area_type ENUM('department', 'service') NULL AFTER shift_type,
ADD COLUMN area_id INT NULL AFTER area_type,
ADD COLUMN start_time TIME NULL COMMENT 'Start time for temporary assignment' AFTER shift_end,
ADD COLUMN end_time TIME NULL COMMENT 'End time for temporary assignment' AFTER start_time,
ADD COLUMN end_date DATE NULL COMMENT 'End date for multi-day assignments' AFTER end_time;

-- Add index for area lookups
ALTER TABLE manual_assignments
ADD INDEX idx_area_assignment (area_type, area_id, assignment_date);

-- Add foreign key constraints for area assignments
-- Note: We cannot add FK to departments/services directly due to ENUM, 
-- but we add indexes for performance

-- Update comments
ALTER TABLE manual_assignments
MODIFY COLUMN shift_start TIME NULL COMMENT 'Shift start time (NULL uses default for shift type)',
MODIFY COLUMN shift_end TIME NULL COMMENT 'Shift end time (NULL uses default for shift type)';

-- Migration notes:
-- 1. area_type and area_id are NULL for regular manual shift assignments
-- 2. When area_type and area_id are set, this represents a temporary area assignment
-- 3. start_time and end_time define the time range for the temporary assignment
-- 4. end_date allows multi-day temporary assignments (e.g., Monday to Wednesday)
-- 5. assignment_date is the start date of the temporary assignment

