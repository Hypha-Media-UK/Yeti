import { StaffMember, StaffMemberWithShift } from './staff';

/**
 * Shift type determines which shift column staff appear in on the rota
 * - 'day': Staff appear in the Day Shift column
 * - 'night': Staff appear in the Night Shift column
 */
export type ShiftType = 'day' | 'night';

/**
 * Shift status indicates the current state of a staff member's shift
 * - 'active': Staff is currently working (current time is within their shift hours)
 * - 'pending': Staff will work later today (current time is before their shift start)
 * - 'expired': Staff has finished working today (current time is after their shift end)
 */
export type ShiftStatus = 'active' | 'pending' | 'expired';

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
  staff: StaffMemberWithShift;
  shiftType: ShiftType; // Changed from ShiftGroup to ShiftType
  shiftStart: string;
  shiftEnd: string;
  isManualAssignment: boolean;
  isFixedSchedule: boolean;
  assignmentDate: string;
  status: ShiftStatus; // Current status: active, pending, or expired
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
  areaType: 'department' | 'service' | null; // For temporary area assignments
  areaId: number | null; // For temporary area assignments
  shiftStart: string | null;
  shiftEnd: string | null;
  startTime: string | null; // Start time for temporary assignment
  endTime: string | null; // End time for temporary assignment
  endDate: string | null; // End date for multi-day assignments
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a temporary area assignment
 */
export interface CreateTemporaryAssignmentDto {
  staffId: number;
  areaType: 'department' | 'service';
  areaId: number;
  assignmentDate: string; // Start date (YYYY-MM-DD)
  endDate?: string | null; // End date for multi-day assignments (YYYY-MM-DD)
  shiftType: ShiftType; // day or night
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  notes?: string | null;
}

