import type { Department } from './department';
import type { Shift } from './shift';
import type { Absence } from './absence';

export type StaffStatus = 'Regular' | 'Relief' | 'Supervisor';
export type CycleType = '4-on-4-off' | '16-day-supervisor' | 'relief' | null;

export interface StaffMember {
  /** Unique identifier for the staff member */
  id: number;

  /** Staff member's first name */
  firstName: string;

  /** Staff member's last name */
  lastName: string;

  /** Employment status: Regular, Relief, or Supervisor */
  status: StaffStatus;

  /** Foreign key to shifts table - determines which shift group this staff belongs to */
  shiftId: number | null;

  /** Type of rotation cycle this staff follows */
  cycleType: CycleType;

  /** Number of days offset from app_zero_date for this staff member's cycle */
  daysOffset: number;

  /**
   * For supervisors only: Position in the 16-day supervisor cycle (0, 4, 8, or 12).
   * Determines which 4-day working block the supervisor is assigned to.
   * - Offset 0: Works days 7-10 (positions in cycle), nights 15-2
   * - Offset 4: Works days 11-14 (positions in cycle), nights 3-6
   * - Offset 8: Works days 15-2 (positions in cycle), nights 7-10
   * - Offset 12: Works days 3-6 (positions in cycle), nights 11-14
   * NULL for non-supervisor staff.
   */
  supervisorOffset: number | null;

  /** Custom shift start time in HH:mm:ss format (overrides shift's default start time) */
  customShiftStart: string | null;

  /** Custom shift end time in HH:mm:ss format (overrides shift's default end time) */
  customShiftEnd: string | null;

  /**
   * @deprecated This field is deprecated and should not be used in new code.
   * Use `referenceShiftId` instead.
   *
   * This field is kept for backward compatibility with existing database records
   * but will be removed in a future version after a database migration.
   *
   * Previously used to indicate if permanent staff should use cycle-based scheduling.
   * Now replaced by the more flexible `referenceShiftId` system.
   */
  useCycleForPermanent: boolean;

  /**
   * For permanent staff: references a shift whose cycle pattern to use.
   * This allows permanent staff to follow a shift's rotation cycle without being
   * assigned to that shift directly.
   *
   * Replaces the deprecated `useCycleForPermanent` field with a more flexible approach.
   */
  referenceShiftId: number | null;

  /**
   * If true, shift-based staff use contracted hours instead of shift cycle.
   * This allows shift staff to have custom working patterns defined by
   * their contracted hours rather than following the shift's rotation cycle.
   */
  useContractedHoursForShift: boolean;

  /**
   * If true, this staff member is part of the pool (not assigned to specific areas).
   * Pool staff appear in the main rota shift panels but are available for
   * temporary assignment to any department/service as needed.
   * This can apply to both Regular and Relief staff.
   */
  isPoolStaff: boolean;

  /**
   * Which day of the staff member's 4-day cycle they finish early (1-4).
   * NULL if no early finish.
   * - Day shifts: finish at 19:00 instead of 20:00
   * - Night shifts: finish at 07:00 instead of 08:00
   */
  earlyFinishDay: number | null;

  /** Whether this staff member is active (soft delete flag) */
  isActive: boolean;

  /** Timestamp when this record was created */
  createdAt: string;

  /** Timestamp when this record was last updated */
  updatedAt: string;
}

/**
 * Staff member with their assigned shift details populated.
 * Used when displaying staff on the rota or in shift-related views.
 */
export interface StaffMemberWithShift extends StaffMember {
  /** The shift this staff member is assigned to (null if no shift assigned) */
  shift: Shift | null;

  /** Active absence record if staff is currently absent (optional) */
  currentAbsence?: Absence | null;
}

/**
 * Staff member with their department details populated.
 * Used when displaying staff in department-related views.
 */
export interface StaffMemberWithDepartment extends StaffMember {
  /** The department this staff member is allocated to (null if no allocation) */
  department: Department | null;
}

/**
 * Fixed schedule for staff members who don't follow rotation cycles.
 * Defines specific working hours for specific days of the week.
 *
 * @example
 * // Staff works Monday-Friday 9am-5pm
 * { dayOfWeek: 1, shiftStart: '09:00', shiftEnd: '17:00' }
 */
export interface FixedSchedule {
  /** Unique identifier for this fixed schedule entry */
  id: number;

  /** Foreign key to staff table */
  staffId: number;

  /** Day of week (1=Monday, 7=Sunday) or null for all days */
  dayOfWeek: number | null;

  /** Shift start time in HH:mm format */
  shiftStart: string;

  /** Shift end time in HH:mm format */
  shiftEnd: string;

  /** Date from which this schedule is effective (null = always) */
  effectiveFrom: string | null;

  /** Date until which this schedule is effective (null = indefinite) */
  effectiveTo: string | null;

  /** Timestamp when this record was created */
  createdAt: string;

  /** Timestamp when this record was last updated */
  updatedAt: string;
}

