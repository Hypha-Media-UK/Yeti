-- Add department_id to staff table
-- LEGACY: This column is later removed in migration 012
-- Kept for migration history - replaced by staff_allocations many-to-many table
ALTER TABLE staff
ADD COLUMN department_id INT NULL AFTER `group`,
ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
ADD INDEX idx_department_id (department_id);

