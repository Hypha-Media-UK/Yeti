-- Add shift_id column to staff table
-- This replaces the old `group` ENUM('Day', 'Night') with a foreign key to shifts table
-- Migration strategy: Keep both columns temporarily for safe migration

ALTER TABLE staff
ADD COLUMN shift_id INT NULL AFTER `group`,
ADD FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL,
ADD INDEX idx_shift_id (shift_id);

-- Migrate existing data: Map 'Day' group to shift_id 1, 'Night' group to shift_id 2
-- These IDs correspond to the default shifts created in migration 016
UPDATE staff SET shift_id = 1 WHERE `group` = 'Day';
UPDATE staff SET shift_id = 2 WHERE `group` = 'Night';

-- Note: The `group` column will be removed in a later migration (019) after validation
-- This allows for rollback if needed

