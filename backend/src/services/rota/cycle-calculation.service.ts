import { StaffMemberWithShift } from '../../../shared/types/staff';
import { Shift, ShiftType } from '../../../shared/types/shift';
import { daysBetween } from '../../utils/date.utils';
import { isShiftActiveOnDate, calculateCycleStatus } from '../../utils/cycle.utils';

/**
 * CycleCalculationService
 * 
 * Responsible for all shift cycle calculations:
 * - Determining which shifts are active on a given date
 * - Calculating if a staff member is on duty based on their cycle
 * - Handling different cycle types (4-on-4-off, 16-day supervisor, etc.)
 * 
 * This service contains pure mathematical logic with no database queries.
 */
export class CycleCalculationService {
  /**
   * Calculate which shifts are active on a given date
   * This is a pure math calculation - no database queries
   * 
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @param appZeroDate - The app's zero date reference point
   * @param allShifts - All available shifts
   * @returns Array of shifts that are active on the target date
   */
  calculateActiveShifts(targetDate: string, appZeroDate: string, allShifts: Shift[]): Shift[] {
    const daysSinceZero = daysBetween(appZeroDate, targetDate);
    const activeShifts: Shift[] = [];

    for (const shift of allShifts) {
      // Use centralized cycle utility to check if shift is active
      if (isShiftActiveOnDate(shift.cycleType, shift.cycleLength, daysSinceZero, shift.daysOffset)) {
        activeShifts.push(shift);
      }
    }

    console.log(`[CYCLE] calculateActiveShifts: ${activeShifts.length} active shifts on ${targetDate}`);
    return activeShifts;
  }

  /**
   * Calculate if a staff member is on duty for a given date based on their cycle
   * 
   * Priority for offset calculation:
   * 1. Personal offset if set AND non-zero
   * 2. Shift's offset (default)
   * 
   * Note: A personal offset of 0 means "use the shift offset", not "override with 0"
   * 
   * @param staff - Staff member with shift information
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @param appZeroDate - The app's zero date reference point
   * @returns Object with onDuty status and shift type
   */
  isStaffOnDuty(
    staff: StaffMemberWithShift,
    targetDate: string,
    appZeroDate: string
  ): { onDuty: boolean; shiftType: ShiftType | null } {
    // Relief staff are only on duty via manual assignments
    if (staff.status === 'Relief') {
      return { onDuty: false, shiftType: null };
    }

    const daysSinceZero = daysBetween(appZeroDate, targetDate);

    // Use centralized cycle utility for Supervisor
    if (staff.status === 'Supervisor') {
      const supervisorOffset = staff.supervisorOffset ?? 0;
      return calculateCycleStatus('16-day-supervisor', daysSinceZero, supervisorOffset);
    }

    // Use personal offset if set AND non-zero, otherwise use shift's offset
    // A personal offset of 0 means "use the shift offset", not "override with 0"
    const effectiveOffset = (staff.daysOffset !== null && staff.daysOffset !== undefined && staff.daysOffset !== 0)
      ? staff.daysOffset
      : (staff.shift?.daysOffset || 0);

    // Use centralized cycle utility for Regular staff
    // Use shift's cycle type instead of deprecated staff.cycleType
    if (staff.status === 'Regular' && staff.shift?.cycleType === '4-on-4-off') {
      const result = calculateCycleStatus('4-on-4-off', daysSinceZero, effectiveOffset);
      // For regular staff, use shift type from their assigned shift if available
      if (result.onDuty && staff.shift?.type) {
        return { onDuty: true, shiftType: staff.shift.type };
      }
      return result;
    }

    return { onDuty: false, shiftType: null };
  }

  /**
   * Calculate effective offset for a staff member
   *
   * @param staff - Staff member with shift information
   * @returns The effective offset to use for cycle calculations
   */
  getEffectiveOffset(staff: StaffMemberWithShift): number {
    // Supervisors use supervisor_offset
    if (staff.status === 'Supervisor') {
      return staff.supervisorOffset ?? 0;
    }

    // Regular staff: Use personal offset if set AND non-zero, otherwise use shift's offset
    if (staff.daysOffset !== null && staff.daysOffset !== undefined && staff.daysOffset !== 0) {
      return staff.daysOffset;
    }
    return staff.shift?.daysOffset || 0;
  }

  /**
   * Check if a staff member is working on a specific date based on their cycle
   * This is a simplified version used for permanent staff allocation checks
   * 
   * @param staff - Staff member with shift information
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @param appZeroDate - The app's zero date reference point
   * @param referenceShift - Optional reference shift for permanent staff
   * @returns True if staff is working on the date
   */
  isStaffWorkingOnDateByCycle(
    staff: StaffMemberWithShift,
    targetDate: string,
    appZeroDate: string,
    referenceShift?: Shift
  ): boolean {
    // Relief staff only work when manually assigned
    if (staff.status === 'Relief') {
      return false;
    }

    const daysSinceZero = daysBetween(appZeroDate, targetDate);

    // If staff has a reference shift, use its offset
    if (referenceShift && referenceShift.cycleType) {
      const effectiveOffset = referenceShift.daysOffset || 0;
      const { onDuty } = calculateCycleStatus(referenceShift.cycleType, daysSinceZero, effectiveOffset);
      return onDuty;
    }

    // Use centralized cycle utility
    if (staff.status === 'Supervisor') {
      const supervisorOffset = staff.supervisorOffset ?? 0;
      const { onDuty } = calculateCycleStatus('16-day-supervisor', daysSinceZero, supervisorOffset);
      return onDuty;
    } else {
      // Regular staff: Use personal offset if set, otherwise use shift's offset
      const effectiveOffset = (staff.daysOffset !== null && staff.daysOffset !== undefined)
        ? staff.daysOffset
        : (staff.shift?.daysOffset || 0);

      // Regular staff: 4-on-4-off (8-day cycle)
      const { onDuty } = calculateCycleStatus('4-on-4-off', daysSinceZero, effectiveOffset);
      return onDuty;
    }
  }
}

