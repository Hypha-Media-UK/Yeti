-- Migration: Add include_in_tasks to departments table
-- Purpose: Allow departments to be marked as frequently used in tasks
-- These departments will appear at the top of the origin department list in the task modal

ALTER TABLE departments
ADD COLUMN include_in_tasks BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN departments.include_in_tasks IS 
'When true, this department appears at the top of the origin department list in the task creation modal';

-- Create index for querying departments that should be prioritized in tasks
CREATE INDEX idx_departments_include_in_tasks ON departments(include_in_tasks) WHERE include_in_tasks = TRUE;

