import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface StaffRow extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  status: 'Regular' | 'Relief' | 'Supervisor';
  group: 'Day' | 'Night' | null;
  department_id: number | null;
  cycle_type: string | null;
  days_offset: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConfigRow extends RowDataPacket {
  id: number;
  key: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}

export interface FixedScheduleRow extends RowDataPacket {
  id: number;
  staff_id: number;
  day_of_week: number | null;
  shift_start: string;
  shift_end: string;
  effective_from: Date | null;
  effective_to: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ManualAssignmentRow extends RowDataPacket {
  id: number;
  staff_id: number;
  assignment_date: Date;
  shift_type: 'Day' | 'Night';
  shift_start: string | null;
  shift_end: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BuildingRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DepartmentRow extends RowDataPacket {
  id: number;
  name: string;
  building_id: number | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type InsertResult = ResultSetHeader;

