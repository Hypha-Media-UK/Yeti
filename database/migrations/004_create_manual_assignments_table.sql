-- Create manual_assignments table for override assignments
CREATE TABLE IF NOT EXISTS manual_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    assignment_date DATE NOT NULL,
    shift_type ENUM('Day', 'Night') NOT NULL,
    shift_start TIME NULL COMMENT 'NULL uses default for shift type',
    shift_end TIME NULL COMMENT 'NULL uses default for shift type',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_date_shift (staff_id, assignment_date, shift_type),
    INDEX idx_assignment_date (assignment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

