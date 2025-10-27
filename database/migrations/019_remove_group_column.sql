-- Remove deprecated `group` column from staff table
-- This completes the migration to the shift-based system
-- The `group` ENUM('Day', 'Night') has been replaced by shift_id foreign key

-- Verify all staff with group values have been migrated to shift_id
-- This query should return 0 rows if migration is complete
-- SELECT COUNT(*) FROM staff WHERE `group` IS NOT NULL AND shift_id IS NULL;

-- Drop the index on group column
DROP INDEX idx_group ON staff;

-- Drop the group column
ALTER TABLE staff DROP COLUMN `group`;

