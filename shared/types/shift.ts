import { StaffMember } from './staff';

/**
 * Shift type determines which shift column staff appear in on the rota
 * - 'day': Staff appear in the Day Shift column
 * - 'night': Staff appear in the Night Shift column
 */
export type ShiftType = 'day' | 'night';

/**
 * Shift entity - represents a named group of staff
 * Replaces the old ENUM('Day', 'Night') group field with a more flexible system
 */
export interface Shift {
  id: number;
  name: string;
  type: ShiftType;
  color: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new shift
 */
export interface CreateShiftDto {
  name: string;
  type: ShiftType;
  color?: string;
  description?: string | null;
}

/**
 * DTO for updating an existing shift
 */
export interface UpdateShiftDto {
  name?: string;
  type?: ShiftType;
  color?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ShiftAssignment {
  staff: StaffMember;
  shiftType: ShiftType; // Changed from ShiftGroup to ShiftType
  shiftStart: string;
  shiftEnd: string;
  isManualAssignment: boolean;
  isFixedSchedule: boolean;
  assignmentDate: string;
}

export interface DayRota {
  date: string;
  dayShifts: ShiftAssignment[];
  nightShifts: ShiftAssignment[];
}

export interface ManualAssignment {
  id: number;
  staffId: number;
  assignmentDate: string;
  shiftType: ShiftType; // Changed from ShiftGroup to ShiftType
  shiftStart: string | null;
  shiftEnd: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

