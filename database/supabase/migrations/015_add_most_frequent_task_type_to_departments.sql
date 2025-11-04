-- Migration: Add most_frequent_task_type_id to departments table
-- Purpose: Allow departments to have a default task type that auto-populates in task creation
-- When a user selects a department as origin, if it has a frequent task type, 
-- the task type field will automatically jump to that value

ALTER TABLE departments
ADD COLUMN most_frequent_task_type_id INTEGER REFERENCES task_types(id) ON DELETE SET NULL;

COMMENT ON COLUMN departments.most_frequent_task_type_id IS 
'The most frequently used task type for this department. When this department is selected as origin in task creation, this task type will be auto-selected';

-- Create index for querying departments with frequent task types
CREATE INDEX idx_departments_most_frequent_task_type ON departments(most_frequent_task_type_id) WHERE most_frequent_task_type_id IS NOT NULL;

