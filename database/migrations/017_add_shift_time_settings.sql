-- Add configurable shift time settings to config table
-- These replace the hardcoded SHIFT_TIMES constants

INSERT INTO config (`key`, value) VALUES
  ('day_shift_start', '08:00'),
  ('day_shift_end', '20:00'),
  ('night_shift_start', '20:00'),
  ('night_shift_end', '08:00')
ON DUPLICATE KEY UPDATE value = VALUES(value);

