-- Create shifts table for shift-based scheduling
-- Shifts are named groups that categorize staff into day/night teams
-- This replaces the old ENUM('Day', 'Night') group field with a more flexible system

CREATE TABLE IF NOT EXISTS shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('day', 'night') NOT NULL COMMENT 'Determines which shift column staff appear in',
  color VARCHAR(7) DEFAULT '#3B82F6' COMMENT 'Hex color for UI display',
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_type (type),
  INDEX idx_is_active (is_active),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default shifts to match existing Day/Night groups
-- These will be used during migration from the old group system
INSERT INTO shifts (name, type, color, description) VALUES
  ('Day Shift', 'day', '#3B82F6', 'Default day shift (08:00-20:00)'),
  ('Night Shift', 'night', '#8B5CF6', 'Default night shift (20:00-08:00)');

