-- Add department_id to staff table
ALTER TABLE staff 
ADD COLUMN department_id INT NULL AFTER `group`,
ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
ADD INDEX idx_department_id (department_id);

