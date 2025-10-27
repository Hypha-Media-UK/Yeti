import type { Department } from './department';
import type { Shift } from './shift';

export type StaffStatus = 'Regular' | 'Relief' | 'Supervisor';
export type CycleType = '4-on-4-off' | 'supervisor' | null;

export interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  status: StaffStatus;
  shiftId: number | null;
  cycleType: CycleType;
  daysOffset: number;
  customShiftStart: string | null;  // Custom shift start time (e.g., "10:00:00")
  customShiftEnd: string | null;    // Custom shift end time (e.g., "22:00:00")
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMemberWithShift extends StaffMember {
  shift: Shift | null;
}

export interface StaffMemberWithDepartment extends StaffMember {
  department: Department | null;
}

export interface FixedSchedule {
  id: number;
  staffId: number;
  dayOfWeek: number | null;
  shiftStart: string;
  shiftEnd: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

