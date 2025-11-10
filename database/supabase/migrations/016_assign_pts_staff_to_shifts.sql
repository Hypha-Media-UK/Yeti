-- Migration: Assign PTS staff to their appropriate shifts
-- This makes PTS staff appear in shift panels on the Config screen
-- just like Day/Night shift staff do

-- Background:
-- PTS staff were using reference_shift_id (for permanently allocated staff)
-- instead of shift_id (for pool staff). This caused them to not appear
-- in the shift panels on the Config screen.

-- Solution:
-- Set shift_id = reference_shift_id for PTS staff who have a reference_shift_id
-- This makes them "pool staff" assigned to PTS shifts, so they appear in the
-- shift panels while still being permanently allocated to the PTS service.

-- Update PTS staff to use shift_id instead of reference_shift_id
UPDATE staff
SET shift_id = reference_shift_id
WHERE reference_shift_id IN (
  SELECT id FROM shifts WHERE name LIKE 'PTS%'
)
AND shift_id IS NULL;

-- For PTS staff using contracted hours (Roy Harris, Lynne Warner),
-- we need to assign them to a PTS shift and set use_contracted_hours_for_shift = true
-- This allows them to appear in the shift panel while using their contracted hours

-- First, let's assign them to PTS 8-8 (shift_id 25) as a default
UPDATE staff
SET 
  shift_id = (SELECT id FROM shifts WHERE name = 'PTS 8-8' LIMIT 1),
  use_contracted_hours_for_shift = true
WHERE id IN (
  SELECT staff_id 
  FROM staff_allocations 
  WHERE area_type = 'service' 
    AND area_id = (SELECT id FROM services WHERE name = 'Patient Transport Services' LIMIT 1)
)
AND shift_id IS NULL
AND reference_shift_id IS NULL;

-- Clear reference_shift_id for PTS staff since they now use shift_id
UPDATE staff
SET reference_shift_id = NULL
WHERE shift_id IN (
  SELECT id FROM shifts WHERE name LIKE 'PTS%'
);

-- Clean up duplicate PTS shifts (there were duplicates created during testing)
-- Keep the shifts that have staff assigned or have lower IDs
DELETE FROM shifts
WHERE name LIKE 'PTS%'
  AND id NOT IN (25, 26, 29, 30)
  AND id IN (
    SELECT id FROM shifts WHERE name LIKE 'PTS%'
  );

-- Activate all PTS shifts (some were marked inactive)
UPDATE shifts
SET is_active = true
WHERE name LIKE 'PTS%' AND is_active = false;

