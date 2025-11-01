-- Supabase PostgreSQL Schema for Staff Rota Application
-- Converted from MySQL 8.3 to PostgreSQL
-- Migration Date: 2025-10-28

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: config
-- Application-wide configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_config_key ON config(key);

-- Insert initial config
-- Note: app_zero_date changed from 2024-01-01 to 2025-10-26 on 2025-10-30
-- Supervisor shift offsets were increased by 8 to compensate for the 664-day difference
INSERT INTO config (key, value) VALUES
    ('app_zero_date', '2025-10-26'),
    ('time_zone', 'Europe/London')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- TABLE: buildings
-- Physical building locations
-- ============================================================================
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buildings_name ON buildings(name);
CREATE INDEX idx_buildings_is_active ON buildings(is_active);

-- ============================================================================
-- TABLE: departments
-- Departments within buildings
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
    description TEXT,
    include_in_main_rota BOOLEAN DEFAULT FALSE,
    is_24_7 BOOLEAN DEFAULT FALSE,
    requires_minimum_staffing BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_building_id ON departments(building_id);
CREATE INDEX idx_departments_is_active ON departments(is_active);
CREATE INDEX idx_departments_is_24_7 ON departments(is_24_7);
CREATE INDEX idx_departments_requires_staffing ON departments(requires_minimum_staffing);

-- ============================================================================
-- TABLE: services
-- Service areas (not tied to buildings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    include_in_main_rota BOOLEAN DEFAULT FALSE,
    is_24_7 BOOLEAN DEFAULT FALSE,
    requires_minimum_staffing BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_is_24_7 ON services(is_24_7);
CREATE INDEX idx_services_requires_staffing ON services(requires_minimum_staffing);

-- ============================================================================
-- TABLE: shifts
-- Shift definitions (Day, Night, etc.)
-- ============================================================================
CREATE TYPE shift_type AS ENUM ('day', 'night');

CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type shift_type NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shifts_type ON shifts(type);
CREATE INDEX idx_shifts_is_active ON shifts(is_active);
CREATE INDEX idx_shifts_name ON shifts(name);

-- ============================================================================
-- TABLE: staff
-- Staff members
-- ============================================================================
CREATE TYPE staff_status AS ENUM ('Regular', 'Relief', 'Supervisor');

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status staff_status NOT NULL,
    shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
    cycle_type VARCHAR(50),
    days_offset INTEGER DEFAULT 0,
    custom_shift_start TIME,
    custom_shift_end TIME,
    use_cycle_for_permanent BOOLEAN DEFAULT FALSE,
    reference_shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
    use_contracted_hours_for_shift BOOLEAN DEFAULT FALSE,
    is_pool_staff BOOLEAN DEFAULT FALSE,
    early_finish_day INTEGER CHECK (early_finish_day >= 1 AND early_finish_day <= 4),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_shift_id ON staff(shift_id);
CREATE INDEX idx_staff_is_pool ON staff(is_pool_staff);
CREATE INDEX idx_staff_early_finish_day ON staff(early_finish_day) WHERE early_finish_day IS NOT NULL;
CREATE INDEX idx_staff_is_active ON staff(is_active);

-- ============================================================================
-- TABLE: staff_allocations
-- Many-to-many: staff to departments/services
-- ============================================================================
CREATE TYPE area_type AS ENUM ('department', 'service');

CREATE TABLE IF NOT EXISTS staff_allocations (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    area_type area_type NOT NULL,
    area_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, area_type, area_id)
);

CREATE INDEX idx_staff_allocations_staff_id ON staff_allocations(staff_id);
CREATE INDEX idx_staff_allocations_area_type_id ON staff_allocations(area_type, area_id);
CREATE INDEX idx_staff_allocations_area_lookup ON staff_allocations(area_type, area_id, staff_id);

-- ============================================================================
-- TABLE: fixed_schedules
-- Custom shift times for staff (future feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fixed_schedules (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 1 AND 7),
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fixed_schedules_staff_id ON fixed_schedules(staff_id);
CREATE INDEX idx_fixed_schedules_effective_dates ON fixed_schedules(staff_id, effective_from, effective_to);

-- ============================================================================
-- TABLE: manual_assignments
-- Manual shift assignments and temporary area assignments
-- ============================================================================
CREATE TYPE shift_type_assignment AS ENUM ('Day', 'Night');

CREATE TABLE IF NOT EXISTS manual_assignments (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    shift_type shift_type_assignment NOT NULL,
    area_type area_type,
    area_id INTEGER,
    shift_start TIME,
    shift_end TIME,
    start_time TIME,
    end_time TIME,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, assignment_date, shift_type)
);

CREATE INDEX idx_manual_assignments_assignment_date ON manual_assignments(assignment_date);
CREATE INDEX idx_manual_assignments_area_assignment ON manual_assignments(area_type, area_id, assignment_date);

-- ============================================================================
-- TABLE: staff_absences
-- Planned and ad-hoc absences
-- ============================================================================
CREATE TYPE absence_type AS ENUM ('sickness', 'annual_leave', 'training', 'absence');

CREATE TABLE IF NOT EXISTS staff_absences (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    absence_type absence_type NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_absences_staff_id ON staff_absences(staff_id);
CREATE INDEX idx_staff_absences_date_range ON staff_absences(start_datetime, end_datetime);

-- ============================================================================
-- TABLE: staff_contracted_hours
-- Contracted working hours for staff
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_contracted_hours (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, day_of_week, start_time, end_time)
);

CREATE INDEX idx_staff_contracted_hours_staff_lookup ON staff_contracted_hours(staff_id);
CREATE INDEX idx_staff_contracted_hours_day_lookup ON staff_contracted_hours(day_of_week);
CREATE INDEX idx_staff_contracted_hours_staff_day ON staff_contracted_hours(staff_id, day_of_week);

-- ============================================================================
-- TABLE: area_operational_hours
-- Operational hours for departments and services
-- ============================================================================
CREATE TABLE IF NOT EXISTS area_operational_hours (
    id SERIAL PRIMARY KEY,
    area_type area_type NOT NULL,
    area_id INTEGER NOT NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(area_type, area_id, day_of_week, start_time, end_time)
);

CREATE INDEX idx_area_operational_hours_area_lookup ON area_operational_hours(area_type, area_id);
CREATE INDEX idx_area_operational_hours_day_lookup ON area_operational_hours(day_of_week);
CREATE INDEX idx_area_operational_hours_area_day ON area_operational_hours(area_type, area_id, day_of_week);

-- ============================================================================
-- TABLE: area_staffing_requirements
-- Minimum staffing requirements for departments and services
-- ============================================================================
CREATE TABLE IF NOT EXISTS area_staffing_requirements (
    id SERIAL PRIMARY KEY,
    area_type area_type NOT NULL,
    area_id INTEGER NOT NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    required_staff INTEGER NOT NULL CHECK (required_staff > 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Ensure time_start is before time_end (or handle overnight shifts)
    CONSTRAINT valid_time_range CHECK (time_start < time_end OR (time_start > time_end AND time_end < '12:00:00'))
);

CREATE INDEX idx_area_staffing_area ON area_staffing_requirements(area_type, area_id);
CREATE INDEX idx_area_staffing_day ON area_staffing_requirements(day_of_week);
CREATE INDEX idx_area_staffing_lookup ON area_staffing_requirements(area_type, area_id, day_of_week);

-- ============================================================================
-- FUNCTIONS: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_allocations_updated_at BEFORE UPDATE ON staff_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixed_schedules_updated_at BEFORE UPDATE ON fixed_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manual_assignments_updated_at BEFORE UPDATE ON manual_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_absences_updated_at BEFORE UPDATE ON staff_absences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_contracted_hours_updated_at BEFORE UPDATE ON staff_contracted_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_area_operational_hours_updated_at BEFORE UPDATE ON area_operational_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_area_staffing_requirements_updated_at BEFORE UPDATE ON area_staffing_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS for all tables (configure policies as needed)
-- ============================================================================
-- Note: For now, we'll keep RLS disabled for simplicity
-- You can enable it later with proper policies for multi-tenant scenarios

-- ALTER TABLE config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
-- etc...

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE config IS 'Application-wide configuration settings';
COMMENT ON TABLE buildings IS 'Physical building locations';
COMMENT ON TABLE departments IS 'Departments within buildings';
COMMENT ON TABLE services IS 'Service areas not tied to buildings';
COMMENT ON TABLE shifts IS 'Shift type definitions';
COMMENT ON TABLE staff IS 'Staff members';
COMMENT ON TABLE staff_allocations IS 'Many-to-many relationship between staff and areas';
COMMENT ON TABLE fixed_schedules IS 'Custom shift times for staff (future feature)';
COMMENT ON TABLE manual_assignments IS 'Manual shift assignments and temporary area assignments';
COMMENT ON TABLE staff_absences IS 'Planned and ad-hoc staff absences';
COMMENT ON TABLE staff_contracted_hours IS 'Contracted working hours for staff members';
COMMENT ON TABLE area_operational_hours IS 'Operational hours for departments and services';

