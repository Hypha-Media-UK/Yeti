-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed services
INSERT INTO services (name) VALUES
  ('Patient Transport Services'),
  ('Medical Records'),
  ('Blood Drivers'),
  ('Post'),
  ('Laundry'),
  ('External Waste'),
  ('Internal Waste (Sharps)'),
  ('Ad-Hoc'),
  ('District Drivers');

