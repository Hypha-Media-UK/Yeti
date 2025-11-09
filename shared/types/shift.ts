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
 * Cycle type for shifts
 * - '4-on-4-off': Regular 8-day cycle (4 days on, 4 days off)
 * - '16-day-supervisor': Supervisor 16-day cycle (4 day, 4 off, 4 night, 4 off)
 * - 'relief': Relief staff (no cycle, manual assignments only)
 * - 'fixed': Fixed schedule (uses fixed_schedules table)
 */
export type CycleType = '4-on-4-off' | '16-day-supervisor' | 'relief' | 'fixed';

/**
 * Shift entity - represents a named group of staff with a rotation cycle
 * Replaces the old ENUM('Day', 'Night') group field with a more flexible system
 */
export interface Shift {
  id: number;
  name: string;
  type: ShiftType;
  color: string;
  description: string | null;
  cycleType: CycleType | null;
  cycleLength: number | null;  // 8 for regular, 16 for supervisor, null for relief/fixed
  daysOffset: number;           // Offset from app_zero_date for this shift group
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
  cycleType?: CycleType | null;
  cycleLength?: number | null;
  daysOffset?: number;
}

/**
 * DTO for updating an existing shift
 */
export interface UpdateShiftDto {
  name?: string;
  type?: ShiftType;
  color?: string;
  description?: string | null;
  cycleType?: CycleType | null;
  cycleLength?: number | null;
  daysOffset?: number;
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
  hasAreaAllocation?: boolean; // True if staff has been allocated to a department/service
}

export interface DayRota {
  date: string;
  dayShifts: ShiftAssignment[];
  nightShifts: ShiftAssignment[];
  // Yesterday's night shift staff who are still working (for task assignment only, not displayed in panels)
  previousNightShift?: ShiftAssignment[];
}

export interface AreaWithStaff {
  id: number;
  name: string;
  type: 'department' | 'service';
  buildingId?: number;
  operationalHours?: any[];
  staff?: any[];
}

export interface DaySnapshot {
  date: string;
  rota: DayRota;
  areas: AreaWithStaff[];
  loadedAt: number; // Timestamp for LRU tracking
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

