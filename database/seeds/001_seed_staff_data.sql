-- Seed staff data with actual staff members
-- Distribution: ~60 Regular Day, ~20 Regular Night, ~5 Supervisors, ~5 Relief

-- Regular Day Staff - Group A (offset 0)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Alan', 'Clark', 'Regular', 'Day', '4-on-4-off', 0),
('Alan', 'Kelly', 'Regular', 'Day', '4-on-4-off', 0),
('Andrew', 'Gibson', 'Regular', 'Day', '4-on-4-off', 0),
('Andrew', 'Hassall', 'Regular', 'Day', '4-on-4-off', 0),
('Andrew', 'Trudgeon', 'Regular', 'Day', '4-on-4-off', 0),
('Brian', 'Cassidy', 'Regular', 'Day', '4-on-4-off', 0),
('Chris', 'Huckaby', 'Regular', 'Day', '4-on-4-off', 0),
('Chris', 'Roach', 'Regular', 'Day', '4-on-4-off', 0),
('Chris', 'Wardle', 'Regular', 'Day', '4-on-4-off', 0),
('Colin', 'Bromley', 'Regular', 'Day', '4-on-4-off', 0),
('Craig', 'Butler', 'Regular', 'Day', '4-on-4-off', 0),
('Darren', 'Flowers', 'Regular', 'Day', '4-on-4-off', 0),
('Darren', 'Milhench', 'Regular', 'Day', '4-on-4-off', 0),
('Darren', 'Mycroft', 'Regular', 'Day', '4-on-4-off', 0),
('David', 'Sykes', 'Regular', 'Day', '4-on-4-off', 0);

-- Regular Day Staff - Group B (offset 4)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Dean', 'Pickering', 'Regular', 'Day', '4-on-4-off', 4),
('Duane', 'Kulikowski', 'Regular', 'Day', '4-on-4-off', 4),
('Edward', 'Collier', 'Regular', 'Day', '4-on-4-off', 4),
('Gary', 'Booth', 'Regular', 'Day', '4-on-4-off', 4),
('Gary', 'Bromley', 'Regular', 'Day', '4-on-4-off', 4),
('Gavin', 'Marsden', 'Regular', 'Day', '4-on-4-off', 4),
('Ian', 'Moss', 'Regular', 'Day', '4-on-4-off', 4),
('Ian', 'Speakes', 'Regular', 'Day', '4-on-4-off', 4),
('Jake', 'Moran', 'Regular', 'Day', '4-on-4-off', 4),
('James', 'Bennett', 'Regular', 'Day', '4-on-4-off', 4),
('James', 'Mitchell', 'Regular', 'Day', '4-on-4-off', 4),
('Jason', 'Newton', 'Regular', 'Day', '4-on-4-off', 4),
('Jeff', 'Robinson', 'Regular', 'Day', '4-on-4-off', 4),
('Joe', 'Redfearn', 'Regular', 'Day', '4-on-4-off', 4),
('John', 'Evans', 'Regular', 'Day', '4-on-4-off', 4);

-- Regular Day Staff - Group C (offset 2)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Jordon', 'Fish', 'Regular', 'Day', '4-on-4-off', 2),
('Kevin', 'Gaskell', 'Regular', 'Day', '4-on-4-off', 2),
('Kevin', 'Tomlinson', 'Regular', 'Day', '4-on-4-off', 2),
('Kyle', 'Blackshaw', 'Regular', 'Day', '4-on-4-off', 2),
('Kyle', 'Sanderson', 'Regular', 'Day', '4-on-4-off', 2),
('Lee', 'Stafford', 'Regular', 'Day', '4-on-4-off', 2),
('Lewis', 'Yearsley', 'Regular', 'Day', '4-on-4-off', 2),
('Mark', 'Dickinson', 'Regular', 'Day', '4-on-4-off', 2),
('Mark', 'Haughton', 'Regular', 'Day', '4-on-4-off', 2),
('Mark', 'Lloyd', 'Regular', 'Day', '4-on-4-off', 2),
('Mark', 'Walton', 'Regular', 'Day', '4-on-4-off', 2),
('Martin', 'Hobson', 'Regular', 'Day', '4-on-4-off', 2),
('Martin', 'Kenyon', 'Regular', 'Day', '4-on-4-off', 2),
('Matthew', 'Bennett', 'Regular', 'Day', '4-on-4-off', 2),
('Matthew', 'Cope', 'Regular', 'Day', '4-on-4-off', 2);

-- Regular Day Staff - Group D (offset 6)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Matthew', 'Rushton', 'Regular', 'Day', '4-on-4-off', 6),
('Merv', 'Permalloo', 'Regular', 'Day', '4-on-4-off', 6),
('Michael', 'Shaw', 'Regular', 'Day', '4-on-4-off', 6),
('Mike', 'Brennan', 'Regular', 'Day', '4-on-4-off', 6),
('Nigel', 'Beesley', 'Regular', 'Day', '4-on-4-off', 6),
('Paul', 'Berry', 'Regular', 'Day', '4-on-4-off', 6),
('Paul', 'Fisher', 'Regular', 'Day', '4-on-4-off', 6),
('Paul', 'Flowers', 'Regular', 'Day', '4-on-4-off', 6),
('Peter', 'Moss', 'Regular', 'Day', '4-on-4-off', 6),
('Phil', 'Hollinshead', 'Regular', 'Day', '4-on-4-off', 6),
('Regan', 'Stringer', 'Regular', 'Day', '4-on-4-off', 6),
('Rob', 'Mcpartland', 'Regular', 'Day', '4-on-4-off', 6),
('Robert', 'Frost', 'Regular', 'Day', '4-on-4-off', 6),
('Roy', 'Harris', 'Regular', 'Day', '4-on-4-off', 6),
('Scott', 'Cartledge', 'Regular', 'Day', '4-on-4-off', 6);

-- Regular Night Staff - Group A (offset 0)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Simon', 'Collins', 'Regular', 'Night', '4-on-4-off', 0),
('Soloman', 'Offei', 'Regular', 'Night', '4-on-4-off', 0),
('Stepen', 'Bowater', 'Regular', 'Night', '4-on-4-off', 0),
('Stephen', 'Burke', 'Regular', 'Night', '4-on-4-off', 0),
('Stephen', 'Cooper', 'Regular', 'Night', '4-on-4-off', 0);

-- Regular Night Staff - Group B (offset 4)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Stephen', 'Kirk', 'Regular', 'Night', '4-on-4-off', 4),
('Stephen', 'Scarsbrook', 'Regular', 'Night', '4-on-4-off', 4),
('Steven', 'Richardson', 'Regular', 'Night', '4-on-4-off', 4),
('Stuart', 'Ford', 'Regular', 'Night', '4-on-4-off', 4),
('Stuart', 'Lomas', 'Regular', 'Night', '4-on-4-off', 4);

-- Regular Night Staff - Group C (offset 2)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Tomas', 'Konkol', 'Regular', 'Night', '4-on-4-off', 2),
('Tony', 'Batters', 'Regular', 'Night', '4-on-4-off', 2);

-- Supervisors (4 days / 4 off / 4 nights / 4 off pattern)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('Allen', 'Butler', 'Supervisor', NULL, 'supervisor', 0),
('Andy', 'Clayton', 'Supervisor', NULL, 'supervisor', 4),
('Carla', 'Barton', 'Supervisor', NULL, 'supervisor', 8),
('Charlotte', 'Rimmer', 'Supervisor', NULL, 'supervisor', 12);

-- Relief Staff (manually assigned)
INSERT INTO staff (first_name, last_name, status, `group`, cycle_type, days_offset) VALUES
('AJ', '', 'Relief', NULL, NULL, 0),
('Eloisa', 'Andrew', 'Relief', NULL, NULL, 0),
('Julie', 'Greenough', 'Relief', NULL, NULL, 0),
('Karen', 'Blackett', 'Relief', NULL, NULL, 0),
('Lucy', 'Redfearn', 'Relief', NULL, NULL, 0),
('Lynne', 'Warner', 'Relief', NULL, NULL, 0),
('Nicola', 'Benger', 'Relief', NULL, NULL, 0);

