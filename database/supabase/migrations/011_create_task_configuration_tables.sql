-- Migration: Create task configuration tables
-- Description: Allows users to configure task types, task items, and link them to departments
-- This replaces the hardcoded task types and details with a configurable system

-- ============================================================================
-- TABLE: task_types
-- Configurable task types (formerly hardcoded in shared/types/task.ts)
-- ============================================================================
CREATE TABLE task_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,  -- e.g., "patient-transfer"
  label VARCHAR(100) NOT NULL,         -- e.g., "Patient Transfer"
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_types_is_active ON task_types(is_active);
CREATE INDEX idx_task_types_name ON task_types(name);

COMMENT ON TABLE task_types IS 'Configurable task types for the task management system';
COMMENT ON COLUMN task_types.name IS 'Unique identifier for the task type (URL-safe, lowercase with hyphens)';
COMMENT ON COLUMN task_types.label IS 'Display name for the task type';

-- ============================================================================
-- TABLE: task_items
-- Configurable task items within each task type (formerly "task details")
-- ============================================================================
CREATE TABLE task_items (
  id SERIAL PRIMARY KEY,
  task_type_id INTEGER NOT NULL REFERENCES task_types(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,  -- e.g., "Bed", "Chair", "Trolley"
  
  -- Optional default origin/destination for auto-population in task form
  default_origin_area_id INTEGER,
  default_origin_area_type area_type,
  default_destination_area_id INTEGER,
  default_destination_area_type area_type,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_task_item_per_type UNIQUE(task_type_id, name)
);

CREATE INDEX idx_task_items_task_type ON task_items(task_type_id);
CREATE INDEX idx_task_items_is_active ON task_items(is_active);

COMMENT ON TABLE task_items IS 'Configurable items within each task type with optional default areas';
COMMENT ON COLUMN task_items.default_origin_area_id IS 'Default origin area ID for auto-population (optional)';
COMMENT ON COLUMN task_items.default_destination_area_id IS 'Default destination area ID for auto-population (optional)';

-- ============================================================================
-- TABLE: task_type_departments
-- Links task types to departments that frequently request them
-- ============================================================================
CREATE TABLE task_type_departments (
  id SERIAL PRIMARY KEY,
  task_type_id INTEGER NOT NULL REFERENCES task_types(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_task_type_department UNIQUE(task_type_id, department_id)
);

CREATE INDEX idx_task_type_departments_task_type ON task_type_departments(task_type_id);
CREATE INDEX idx_task_type_departments_department ON task_type_departments(department_id);

COMMENT ON TABLE task_type_departments IS 'Links task types to departments that frequently request them';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_task_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_types_updated_at
  BEFORE UPDATE ON task_types
  FOR EACH ROW
  EXECUTE FUNCTION update_task_types_updated_at();

CREATE OR REPLACE FUNCTION update_task_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_items_updated_at
  BEFORE UPDATE ON task_items
  FOR EACH ROW
  EXECUTE FUNCTION update_task_items_updated_at();

-- ============================================================================
-- SEED DATA: Migrate existing hardcoded task types and details
-- ============================================================================

-- Insert task types (from TASK_TYPE_LABELS in shared/types/task.ts)
INSERT INTO task_types (name, label, description) VALUES
  ('patient-transfer', 'Patient Transfer', 'Tasks related to moving patients between locations'),
  ('samples', 'Samples', 'Tasks related to transporting medical samples'),
  ('asset-move', 'Asset Move', 'Tasks related to moving medical equipment and assets'),
  ('gases', 'Gases', 'Tasks related to delivering medical gases'),
  ('service', 'Service', 'General service tasks');

-- Insert task items (from TASK_DETAIL_OPTIONS in shared/types/task.ts)
-- Patient Transfer items
INSERT INTO task_items (task_type_id, name) VALUES
  ((SELECT id FROM task_types WHERE name = 'patient-transfer'), 'Bed'),
  ((SELECT id FROM task_types WHERE name = 'patient-transfer'), 'Chair'),
  ((SELECT id FROM task_types WHERE name = 'patient-transfer'), 'Trolley');

-- Samples items
INSERT INTO task_items (task_type_id, name) VALUES
  ((SELECT id FROM task_types WHERE name = 'samples'), 'Blood'),
  ((SELECT id FROM task_types WHERE name = 'samples'), 'Other');

-- Asset Move items
INSERT INTO task_items (task_type_id, name) VALUES
  ((SELECT id FROM task_types WHERE name = 'asset-move'), 'Complete Bed'),
  ((SELECT id FROM task_types WHERE name = 'asset-move'), 'Bed Frame'),
  ((SELECT id FROM task_types WHERE name = 'asset-move'), 'Mattress');

-- Gases items
INSERT INTO task_items (task_type_id, name) VALUES
  ((SELECT id FROM task_types WHERE name = 'gases'), 'F Size Oxygen'),
  ((SELECT id FROM task_types WHERE name = 'gases'), 'E Size Oxygen'),
  ((SELECT id FROM task_types WHERE name = 'gases'), 'D Size Oxygen'),
  ((SELECT id FROM task_types WHERE name = 'gases'), 'E Size CO2');

-- Service items
INSERT INTO task_items (task_type_id, name) VALUES
  ((SELECT id FROM task_types WHERE name = 'service'), 'Equinox Change'),
  ((SELECT id FROM task_types WHERE name = 'service'), 'Nitrus Change'),
  ((SELECT id FROM task_types WHERE name = 'service'), 'Notes Conveyed'),
  ((SELECT id FROM task_types WHERE name = 'service'), 'Bed Pans'),
  ((SELECT id FROM task_types WHERE name = 'service'), 'MU''s');

-- ============================================================================
-- MIGRATION: Update existing tasks table to reference task_items
-- ============================================================================

-- Add new column to tasks table
ALTER TABLE tasks ADD COLUMN task_item_id INTEGER REFERENCES task_items(id) ON DELETE SET NULL;

-- Migrate existing task_detail strings to task_item_id references
UPDATE tasks t
SET task_item_id = ti.id
FROM task_items ti
INNER JOIN task_types tt ON ti.task_type_id = tt.id
WHERE t.task_type = tt.name::task_type
  AND t.task_detail = ti.name;

-- Create index on new column
CREATE INDEX idx_tasks_task_item ON tasks(task_item_id);

-- Note: We're keeping the old task_type and task_detail columns for now
-- to maintain backward compatibility. They can be removed in a future migration
-- after confirming the new system works correctly.

COMMENT ON COLUMN tasks.task_item_id IS 'Reference to configurable task item (replaces hardcoded task_detail)';

