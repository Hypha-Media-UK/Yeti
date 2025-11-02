-- Migration: Create tasks table for task management system
-- Description: Allows tracking of tasks between departments/services with assignment and status tracking

-- Create enum types for task management
CREATE TYPE task_type AS ENUM (
  'patient-transfer',
  'samples',
  'asset-move',
  'gases',
  'service'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'in-progress',
  'completed',
  'cancelled'
);

CREATE TYPE area_type AS ENUM (
  'department',
  'service'
);

-- Create tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  
  -- Origin area (where task originates from)
  origin_area_id INTEGER NOT NULL,
  origin_area_type area_type NOT NULL,
  
  -- Destination area (where task is going to)
  destination_area_id INTEGER NOT NULL,
  destination_area_type area_type NOT NULL,
  
  -- Task information
  task_type task_type NOT NULL,
  task_detail VARCHAR(100) NOT NULL,
  
  -- Time tracking
  requested_time TIME NOT NULL,
  allocated_time TIME NOT NULL,
  completed_time TIME,
  
  -- Assignment
  assigned_staff_id INTEGER,
  
  -- Status
  status task_status NOT NULL DEFAULT 'pending',
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT fk_assigned_staff FOREIGN KEY (assigned_staff_id) 
    REFERENCES staff(id) ON DELETE SET NULL,
  
  -- Validation constraints
  CONSTRAINT check_different_areas CHECK (
    NOT (origin_area_id = destination_area_id AND origin_area_type = destination_area_type)
  ),
  CONSTRAINT check_allocated_after_requested CHECK (allocated_time >= requested_time)
);

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'Tracks tasks between departments and services with assignment and status tracking';
COMMENT ON COLUMN tasks.origin_area_id IS 'ID of the department or service where the task originates';
COMMENT ON COLUMN tasks.origin_area_type IS 'Type of origin area (department or service)';
COMMENT ON COLUMN tasks.destination_area_id IS 'ID of the department or service where the task is going';
COMMENT ON COLUMN tasks.destination_area_type IS 'Type of destination area (department or service)';
COMMENT ON COLUMN tasks.task_type IS 'Type of task (patient-transfer, samples, asset-move, gases, service)';
COMMENT ON COLUMN tasks.task_detail IS 'Specific detail about the task type (e.g., "Bed" for patient-transfer)';
COMMENT ON COLUMN tasks.requested_time IS 'Time when the task was requested';
COMMENT ON COLUMN tasks.allocated_time IS 'Time when the task was allocated/scheduled';
COMMENT ON COLUMN tasks.completed_time IS 'Time when the task was completed (nullable)';
COMMENT ON COLUMN tasks.assigned_staff_id IS 'Staff member assigned to the task (nullable for unassigned tasks)';
COMMENT ON COLUMN tasks.status IS 'Current status of the task (pending, in-progress, completed, cancelled)';

-- Create indexes for common queries
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_staff ON tasks(assigned_staff_id) WHERE assigned_staff_id IS NOT NULL;
CREATE INDEX idx_tasks_origin_area ON tasks(origin_area_id, origin_area_type);
CREATE INDEX idx_tasks_destination_area ON tasks(destination_area_id, destination_area_type);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

