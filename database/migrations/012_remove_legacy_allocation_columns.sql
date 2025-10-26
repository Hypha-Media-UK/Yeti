-- Remove legacy allocation columns from staff table
-- Completes migration from single department/service FK to many-to-many staff_allocations
-- Removes columns added in migrations 007 and 009
-- Drop foreign key constraints first
ALTER TABLE staff 
DROP FOREIGN KEY staff_ibfk_1;

ALTER TABLE staff 
DROP FOREIGN KEY staff_ibfk_2;

-- Drop indexes
ALTER TABLE staff 
DROP INDEX idx_department_id;

ALTER TABLE staff 
DROP INDEX idx_service_id;

-- Drop columns
ALTER TABLE staff 
DROP COLUMN department_id,
DROP COLUMN service_id;

