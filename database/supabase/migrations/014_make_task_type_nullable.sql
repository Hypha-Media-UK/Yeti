-- Migration 014: Make task_type and task_detail columns nullable
-- Since we now use task_item_id to reference task types and items, the old task_type
-- and task_detail columns should be nullable for backward compatibility

ALTER TABLE tasks ALTER COLUMN task_type DROP NOT NULL;
ALTER TABLE tasks ALTER COLUMN task_detail DROP NOT NULL;

