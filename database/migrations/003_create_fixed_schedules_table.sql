-- Create fixed_schedules table for custom shift times
-- NOTE: This table exists for future use but is not yet implemented in the UI
-- See docs/FEATURE_STATUS.md for details on planned Fixed Schedules feature
CREATE TABLE IF NOT EXISTS fixed_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    day_of_week TINYINT NULL COMMENT '1=Monday, 7=Sunday, NULL=all days',
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    effective_from DATE NULL,
    effective_to DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    INDEX idx_staff_id (staff_id),
    INDEX idx_effective_dates (staff_id, effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

