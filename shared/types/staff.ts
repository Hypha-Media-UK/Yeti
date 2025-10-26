import type { Department } from './department';

export type StaffStatus = 'Regular' | 'Relief' | 'Supervisor';
export type ShiftGroup = 'Day' | 'Night';
export type CycleType = '4-on-4-off' | 'supervisor' | null;

export interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  status: StaffStatus;
  group: ShiftGroup | null;
  departmentId: number | null;
  cycleType: CycleType;
  daysOffset: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

