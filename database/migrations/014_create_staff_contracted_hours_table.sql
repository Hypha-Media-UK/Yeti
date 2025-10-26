-- Migration 014: Create staff_contracted_hours table
-- This table stores contracted working days and hours for staff members
-- Supports multiple time ranges per day (e.g., split shifts)
-- Supports shifts crossing midnight (start_time can be >= end_time)

CREATE TABLE IF NOT EXISTS staff_contracted_hours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '1=Monday, 2=Tuesday, ..., 7=Sunday (ISO 8601)',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL COMMENT 'Can be <= start_time for shifts crossing midnight',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  
  -- Indexes for efficient querying
  INDEX idx_staff_lookup (staff_id),
  INDEX idx_day_lookup (day_of_week),
  INDEX idx_staff_day (staff_id, day_of_week),
  
  -- Prevent exact duplicate entries
  UNIQUE KEY unique_staff_day_time (staff_id, day_of_week, start_time, end_time),
  
  -- Ensure valid day range (1=Monday through 7=Sunday)
  CHECK (day_of_week BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

