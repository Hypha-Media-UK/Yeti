-- Add service_id to staff table
ALTER TABLE staff 
ADD COLUMN service_id INT NULL AFTER department_id,
ADD FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
ADD INDEX idx_service_id (service_id);

