-- Migration: Make task_type and task_detail nullable
-- Description: Since we now use task_item_id for new tasks, the old task_type and task_detail
--              columns should be nullable to support the new task configuration system

-- Make task_type nullable
ALTER TABLE tasks ALTER COLUMN task_type DROP NOT NULL;

-- Make task_detail nullable
ALTER TABLE tasks ALTER COLUMN task_detail DROP NOT NULL;

-- Add a check constraint to ensure either the old system or new system is used
-- (either task_type+task_detail OR task_item_id must be provided)
ALTER TABLE tasks ADD CONSTRAINT check_task_has_type_or_item 
  CHECK (
    (task_type IS NOT NULL AND task_detail IS NOT NULL) OR 
    (task_item_id IS NOT NULL)
  );

COMMENT ON CONSTRAINT check_task_has_type_or_item ON tasks IS 
  'Ensures either old system (task_type+task_detail) or new system (task_item_id) is used';

