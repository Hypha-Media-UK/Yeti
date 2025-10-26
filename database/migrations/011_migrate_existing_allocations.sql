-- Migrate existing department_id data to staff_allocations
INSERT INTO staff_allocations (staff_id, area_type, area_id)
SELECT id, 'department', department_id
FROM staff
WHERE department_id IS NOT NULL;

-- Migrate existing service_id data to staff_allocations
INSERT INTO staff_allocations (staff_id, area_type, area_id)
SELECT id, 'service', service_id
FROM staff
WHERE service_id IS NOT NULL;

