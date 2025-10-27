-- Create staff_absences table for tracking planned and ad-hoc absences
CREATE TABLE IF NOT EXISTS staff_absences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  absence_type ENUM('sickness', 'annual_leave', 'training', 'absence') NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  INDEX idx_staff_id (staff_id),
  INDEX idx_date_range (start_datetime, end_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

