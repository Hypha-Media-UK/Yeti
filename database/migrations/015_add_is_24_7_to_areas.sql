-- Add is_24_7 column to departments table
ALTER TABLE departments
ADD COLUMN is_24_7 BOOLEAN DEFAULT FALSE AFTER include_in_main_rota;

-- Add is_24_7 column to services table
ALTER TABLE services
ADD COLUMN is_24_7 BOOLEAN DEFAULT FALSE AFTER include_in_main_rota;

-- Add index for is_24_7 on departments
ALTER TABLE departments
ADD INDEX idx_is_24_7 (is_24_7);

-- Add index for is_24_7 on services
ALTER TABLE services
ADD INDEX idx_is_24_7 (is_24_7);

