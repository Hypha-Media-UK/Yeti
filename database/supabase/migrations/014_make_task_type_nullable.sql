-- Migration 014: Make task_type column nullable
-- Since we now use task_item_id to reference task types, the old task_type enum column
-- should be nullable for backward compatibility

ALTER TABLE tasks ALTER COLUMN task_type DROP NOT NULL;

