-- Migration 013: Create area_operational_hours table
-- This table stores operational days and hours for departments and services
-- Supports multiple time ranges per day (e.g., split shifts)
-- Supports shifts crossing midnight (start_time can be >= end_time)

CREATE TABLE IF NOT EXISTS area_operational_hours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area_type ENUM('department', 'service') NOT NULL,
  area_id INT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '1=Monday, 2=Tuesday, ..., 7=Sunday (ISO 8601)',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL COMMENT 'Can be <= start_time for shifts crossing midnight',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for efficient querying on the main rota screen
  INDEX idx_area_lookup (area_type, area_id),
  INDEX idx_day_lookup (day_of_week),
  INDEX idx_area_day (area_type, area_id, day_of_week),
  
  -- Prevent exact duplicate entries
  UNIQUE KEY unique_area_day_time (area_type, area_id, day_of_week, start_time, end_time),
  
  -- Ensure valid day range (1=Monday through 7=Sunday)
  CHECK (day_of_week BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: No foreign key constraints to departments/services tables because we use area_type/area_id pattern
-- This is consistent with the staff_allocations table design
-- Application logic ensures referential integrity

