-- ============================================================================
-- Migration: Add minimum staffing requirements
-- Description: Adds table to store minimum staffing requirements for areas
--              with support for multiple time ranges per day
-- ============================================================================

-- ============================================================================
-- TABLE: area_staffing_requirements
-- Stores minimum staffing requirements for departments and services
-- ============================================================================
CREATE TABLE IF NOT EXISTS area_staffing_requirements (
    id SERIAL PRIMARY KEY,
    area_type VARCHAR(20) NOT NULL CHECK (area_type IN ('department', 'service')),
    area_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    required_staff INTEGER NOT NULL CHECK (required_staff > 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure time_start is before time_end (or handle overnight shifts)
    CONSTRAINT valid_time_range CHECK (time_start < time_end OR (time_start > time_end AND time_end < '12:00:00'))
);

-- Indexes for efficient querying
CREATE INDEX idx_area_staffing_area ON area_staffing_requirements(area_type, area_id);
CREATE INDEX idx_area_staffing_day ON area_staffing_requirements(day_of_week);
CREATE INDEX idx_area_staffing_lookup ON area_staffing_requirements(area_type, area_id, day_of_week);

-- ============================================================================
-- Add requires_minimum_staffing flag to departments and services
-- ============================================================================
ALTER TABLE departments ADD COLUMN IF NOT EXISTS requires_minimum_staffing BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_minimum_staffing BOOLEAN DEFAULT FALSE;

-- Indexes for the new flags
CREATE INDEX idx_departments_requires_staffing ON departments(requires_minimum_staffing);
CREATE INDEX idx_services_requires_staffing ON services(requires_minimum_staffing);

-- ============================================================================
-- Trigger to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_area_staffing_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_area_staffing_requirements_updated_at
    BEFORE UPDATE ON area_staffing_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_area_staffing_requirements_updated_at();

