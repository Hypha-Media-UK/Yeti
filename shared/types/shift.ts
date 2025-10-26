import { ShiftGroup, StaffMember } from './staff';

export interface ShiftAssignment {
  staff: StaffMember;
  shiftType: ShiftGroup;
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
  shiftType: ShiftGroup;
  shiftStart: string | null;
  shiftEnd: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

