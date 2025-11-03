-- Migration: Simplify task types by removing name field
-- Description: Remove the unnecessary 'name' field from task_types table
-- The 'label' field is sufficient for display and identification

-- ============================================================================
-- STEP 1: Remove name column from task_types
-- ============================================================================

-- Drop the index on name column
DROP INDEX IF EXISTS idx_task_types_name;

-- Drop the unique constraint on name
ALTER TABLE task_types DROP CONSTRAINT IF EXISTS task_types_name_key;

-- Drop the name column
ALTER TABLE task_types DROP COLUMN name;

-- Note: The tasks table still uses the task_type enum for backward compatibility.
-- A future migration can add task_type_id to reference task_types.id directly.

