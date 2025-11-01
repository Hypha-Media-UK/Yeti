-- ============================================================================
-- Migration: Fix overnight shift constraints
-- Description: Updates time range constraints to properly support all overnight shifts
-- ============================================================================

-- ============================================================================
-- Fix area_staffing_requirements table constraint
-- ============================================================================

-- Drop the old restrictive constraint
ALTER TABLE area_staffing_requirements 
DROP CONSTRAINT IF EXISTS valid_time_range;

-- Add new constraint that allows any time range where start != end
-- This properly supports overnight shifts (e.g., 22:00 to 14:00)
ALTER TABLE area_staffing_requirements
ADD CONSTRAINT valid_time_range CHECK (time_start != time_end);

-- ============================================================================
-- Fix area_operational_hours table constraint (if it exists)
-- ============================================================================

-- Drop the old restrictive constraint
ALTER TABLE area_operational_hours 
DROP CONSTRAINT IF EXISTS valid_time_range;

-- Add new constraint that allows any time range where start != end
ALTER TABLE area_operational_hours
ADD CONSTRAINT valid_time_range CHECK (start_time != end_time);

-- ============================================================================
-- Fix staff_contracted_hours table constraint (if it exists)
-- ============================================================================

-- Drop the old restrictive constraint
ALTER TABLE staff_contracted_hours 
DROP CONSTRAINT IF EXISTS valid_time_range;

-- Add new constraint that allows any time range where start != end
ALTER TABLE staff_contracted_hours
ADD CONSTRAINT valid_time_range CHECK (start_time != end_time);

