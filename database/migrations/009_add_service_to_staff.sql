-- Add service_id to staff table
-- LEGACY: This column is later removed in migration 012
-- Kept for migration history - replaced by staff_allocations many-to-many table
ALTER TABLE staff
ADD COLUMN service_id INT NULL AFTER department_id,
ADD FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
ADD INDEX idx_service_id (service_id);

