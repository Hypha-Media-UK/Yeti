-- Migration: Add reference_shift_id and use_contracted_hours_for_shift columns
-- Purpose: 
--   1. Allow permanent staff to reference a shift's cycle pattern without being in the shift pool
--   2. Allow shift-based staff to use contracted hours instead of the shift cycle

-- Add reference_shift_id for permanent staff who want to use a shift's cycle pattern
ALTER TABLE staff
ADD COLUMN reference_shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL;

COMMENT ON COLUMN staff.reference_shift_id IS 
'For permanent staff (shift_id = NULL), this references a shift whose cycle pattern should be used to determine working days. The staff member still appears in their permanent allocations, NOT in the shift pool.';

-- Add use_contracted_hours_for_shift for shift-based staff who want custom hours
ALTER TABLE staff
ADD COLUMN use_contracted_hours_for_shift BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN staff.use_contracted_hours_for_shift IS 
'If true, shift-based staff (shift_id IS NOT NULL) use contracted_hours instead of the shift cycle pattern to determine working days. Staff still appear in the shift pool.';

-- Create indexes for performance
CREATE INDEX idx_staff_reference_shift_id ON staff(reference_shift_id) WHERE reference_shift_id IS NOT NULL;
CREATE INDEX idx_staff_use_contracted_hours_for_shift ON staff(use_contracted_hours_for_shift) WHERE use_contracted_hours_for_shift = TRUE;

-- Note: The use_cycle_for_permanent column from migration 003 is now deprecated
-- It will be replaced by checking if reference_shift_id IS NOT NULL
-- We'll keep it for now to avoid breaking existing data, but it should be removed in a future migration

