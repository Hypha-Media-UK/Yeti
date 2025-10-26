-- Create staff_allocations table for many-to-many relationship between staff and areas
CREATE TABLE IF NOT EXISTS staff_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  area_type ENUM('department', 'service') NOT NULL,
  area_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  INDEX idx_staff_id (staff_id),
  INDEX idx_area_type_id (area_type, area_id),
  INDEX idx_area_lookup (area_type, area_id, staff_id),
  
  -- Prevent duplicate allocations
  UNIQUE KEY unique_allocation (staff_id, area_type, area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add include_in_main_rota to departments table
ALTER TABLE departments 
ADD COLUMN include_in_main_rota BOOLEAN DEFAULT FALSE AFTER description;

-- Add include_in_main_rota to services table
ALTER TABLE services 
ADD COLUMN include_in_main_rota BOOLEAN DEFAULT FALSE AFTER description;

