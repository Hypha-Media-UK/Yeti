-- Seed staff data with diverse roles, groups, and offsets for testing

-- Regular Day Staff (4-on-4-off pattern)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('James', 'Smith', 'Regular', 'Day', '4-on-4-off', 0),
('Mary', 'Johnson', 'Regular', 'Day', '4-on-4-off', 0),
('Robert', 'Williams', 'Regular', 'Day', '4-on-4-off', 0),
('Patricia', 'Brown', 'Regular', 'Day', '4-on-4-off', 0),
('Michael', 'Jones', 'Regular', 'Day', '4-on-4-off', 4),
('Jennifer', 'Garcia', 'Regular', 'Day', '4-on-4-off', 4),
('William', 'Miller', 'Regular', 'Day', '4-on-4-off', 4),
('Linda', 'Davis', 'Regular', 'Day', '4-on-4-off', 4);

-- Regular Night Staff (4-on-4-off pattern)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('David', 'Rodriguez', 'Regular', 'Night', '4-on-4-off', 0),
('Barbara', 'Martinez', 'Regular', 'Night', '4-on-4-off', 0),
('Richard', 'Hernandez', 'Regular', 'Night', '4-on-4-off', 0),
('Susan', 'Lopez', 'Regular', 'Night', '4-on-4-off', 0),
('Joseph', 'Gonzalez', 'Regular', 'Night', '4-on-4-off', 4),
('Jessica', 'Wilson', 'Regular', 'Night', '4-on-4-off', 4),
('Thomas', 'Anderson', 'Regular', 'Night', '4-on-4-off', 4),
('Sarah', 'Thomas', 'Regular', 'Night', '4-on-4-off', 4);

-- Supervisors (4 days / 4 off / 4 nights / 4 off pattern)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Charles', 'Taylor', 'Supervisor', NULL, 'supervisor', 0),
('Karen', 'Moore', 'Supervisor', NULL, 'supervisor', 0),
('Christopher', 'Jackson', 'Supervisor', NULL, 'supervisor', 8),
('Nancy', 'Martin', 'Supervisor', NULL, 'supervisor', 8);

-- Relief Staff (manually assigned)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Daniel', 'Lee', 'Relief', NULL, NULL, 0),
('Betty', 'Perez', 'Relief', NULL, NULL, 0),
('Matthew', 'White', 'Relief', NULL, NULL, 0),
('Dorothy', 'Harris', 'Relief', NULL, NULL, 0);

-- Additional Regular Staff with different offsets for variety
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Mark', 'Sanchez', 'Regular', 'Day', '4-on-4-off', 2),
('Lisa', 'Clark', 'Regular', 'Day', '4-on-4-off', 6),
('Donald', 'Ramirez', 'Regular', 'Night', '4-on-4-off', 2),
('Sandra', 'Lewis', 'Regular', 'Night', '4-on-4-off', 6),
('Steven', 'Robinson', 'Regular', 'Day', '4-on-4-off', -2),
('Ashley', 'Walker', 'Regular', 'Night', '4-on-4-off', -2);

