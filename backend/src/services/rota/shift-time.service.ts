import { StaffMemberWithShift } from '../../../shared/types/staff';
import { ShiftType } from '../../../shared/types/shift';
import { StaffContractedHours } from '../../../shared/types/operational-hours';
import { StaffContractedHoursRepository } from '../../repositories/staff-contracted-hours.repository';
import { parseLocalDate, daysBetween } from '../../utils/date.utils';
import { SHIFT_TIMES } from '../../config/constants';
import { calculateCyclePosition, CYCLE_LENGTHS } from '../../utils/cycle.utils';

/**
 * ShiftTimeService
 * 
 * Responsible for calculating shift times for staff members:
 * - Custom shift times (staff-specific overrides)
 * - Contracted hours (day-specific working hours)
 * - Default shift times (fallback)
 * 
 * Priority: Custom > Contracted > Default
 */
export class ShiftTimeService {
  private contractedHoursRepo: StaffContractedHoursRepository;

  constructor() {
    this.contractedHoursRepo = new StaffContractedHoursRepository();
  }

  /**
   * Get default shift times for a shift type
   * 
   * @param shiftType - 'day' or 'night'
   * @returns Shift start and end times, or null if invalid type
   */
  getDefaultShiftTimes(shiftType: ShiftType): { start: string; end: string } | null {
    if (shiftType === 'day') {
      return {
        start: SHIFT_TIMES.DAY.START,
        end: SHIFT_TIMES.DAY.END
      };
    } else if (shiftType === 'night') {
      return {
        start: SHIFT_TIMES.NIGHT.START,
        end: SHIFT_TIMES.NIGHT.END
      };
    }
    return null;
  }

  /**
   * Calculate which day of the 4-day working cycle a staff member is on
   *
   * @param staff - Staff member with shift information
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @param appZeroDate - The app's zero date reference point
   * @returns Day number (1-4) within the working portion of the cycle, or null if not working
   */
  calculateWorkingDayOfCycle(
    staff: StaffMemberWithShift,
    targetDate: string,
    appZeroDate: string
  ): number | null {
    const daysSinceZero = daysBetween(appZeroDate, targetDate);

    // Use personal offset if set AND non-zero, otherwise use shift's offset
    const effectiveOffset = (staff.daysOffset !== null && staff.daysOffset !== undefined && staff.daysOffset !== 0)
      ? staff.daysOffset
      : (staff.shift?.daysOffset || 0);

    // For 4-on-4-off cycle (8-day cycle total)
    if (staff.status === 'Regular' && staff.shift?.cycleType === '4-on-4-off') {
      const cyclePosition = calculateCyclePosition(daysSinceZero, effectiveOffset, CYCLE_LENGTHS.REGULAR);
      // Days 0-3 are working days (1-4), days 4-7 are off
      if (cyclePosition < 4) {
        return cyclePosition + 1; // Convert 0-3 to 1-4
      }
    }

    // For 16-day supervisor cycle
    if (staff.status === 'Supervisor') {
      const cyclePosition = calculateCyclePosition(daysSinceZero, effectiveOffset, CYCLE_LENGTHS.SUPERVISOR);
      // Days 0-3: Day shift (working days 1-4)
      // Days 8-11: Night shift (working days 1-4)
      if (cyclePosition < 4) {
        return cyclePosition + 1; // Day shift: convert 0-3 to 1-4
      } else if (cyclePosition >= 8 && cyclePosition < 12) {
        return (cyclePosition - 8) + 1; // Night shift: convert 8-11 to 1-4
      }
    }

    return null; // Not working or not on a cycle
  }

  /**
   * Get shift times for a specific staff member on a specific date
   *
   * Priority:
   * 1. Custom shift times (staff.customShiftStart/End)
   * 2. Contracted hours for the day
   * 3. Default shift times (with early finish adjustment if applicable)
   *
   * @param staff - Staff member with shift information
   * @param shiftType - 'day' or 'night'
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @param options - Optional pre-fetched data to avoid N+1 queries
   * @returns Shift start and end times, or null if staff doesn't work this day
   */
  async getShiftTimesForStaff(
    staff: StaffMemberWithShift,
    shiftType: ShiftType,
    targetDate: string,
    options?: {
      contractedHoursMap?: Map<number, StaffContractedHours[]>;
      appZeroDate?: string;
    }
  ): Promise<{ start: string; end: string } | null> {
    // Priority 1: Check if staff has custom shift times
    if (staff.customShiftStart && staff.customShiftEnd) {
      return {
        start: staff.customShiftStart,
        end: staff.customShiftEnd
      };
    }

    // Priority 2: Check contracted hours
    let contractedHours: StaffContractedHours[];
    if (options?.contractedHoursMap) {
      contractedHours = options.contractedHoursMap.get(staff.id) || [];
    } else {
      contractedHours = await this.contractedHoursRepo.findByStaff(staff.id);
    }

    if (contractedHours.length > 0) {
      const dateObj = parseLocalDate(targetDate);
      const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

      const hoursForDay = contractedHours.find(ch => ch.dayOfWeek === dayOfWeek);
      if (hoursForDay) {
        // Staff has contracted hours for this day - use them
        return {
          start: hoursForDay.startTime,
          end: hoursForDay.endTime
        };
      } else {
        // Staff has contracted hours defined but NOT for this day - they don't work today
        return null;
      }
    }

    // Priority 3: Fall back to default shift times
    let times = this.getDefaultShiftTimes(shiftType);

    // Check if this is an early finish day
    if (times && staff.earlyFinishDay && options?.appZeroDate) {
      const workingDay = this.calculateWorkingDayOfCycle(staff, targetDate, options.appZeroDate);

      if (workingDay === staff.earlyFinishDay) {
        // This is their early finish day - adjust end time
        if (shiftType === 'day') {
          times = { ...times, end: '19:00:00' }; // Finish at 19:00 instead of 20:00
        } else if (shiftType === 'night') {
          times = { ...times, end: '07:00:00' }; // Finish at 07:00 instead of 08:00
        }
      }
    }

    return times;
  }

  /**
   * Check if staff has contracted hours for a specific day of week
   * 
   * @param staff - Staff member
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @param options - Optional pre-fetched data
   * @returns True if staff has contracted hours for this day
   */
  async hasContractedHoursForDay(
    staff: StaffMemberWithShift,
    targetDate: string,
    options?: {
      contractedHoursMap?: Map<number, StaffContractedHours[]>;
    }
  ): Promise<boolean> {
    let contractedHours: StaffContractedHours[];
    if (options?.contractedHoursMap) {
      contractedHours = options.contractedHoursMap.get(staff.id) || [];
    } else {
      contractedHours = await this.contractedHoursRepo.findByStaff(staff.id);
    }

    if (contractedHours.length === 0) {
      return false;
    }

    const dateObj = parseLocalDate(targetDate);
    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

    return contractedHours.some(ch => ch.dayOfWeek === dayOfWeek);
  }

  /**
   * Batch fetch contracted hours for multiple staff members
   * Useful for avoiding N+1 queries
   * 
   * @param staffIds - Array of staff IDs
   * @returns Map of staff ID to their contracted hours
   */
  async batchFetchContractedHours(staffIds: number[]): Promise<Map<number, StaffContractedHours[]>> {
    const contractedHoursMap = new Map<number, StaffContractedHours[]>();

    // Fetch contracted hours for all staff in parallel
    const contractedHoursPromises = staffIds.map(async (staffId) => {
      const hours = await this.contractedHoursRepo.findByStaff(staffId);
      return { staffId, hours };
    });

    const results = await Promise.all(contractedHoursPromises);

    for (const { staffId, hours } of results) {
      contractedHoursMap.set(staffId, hours);
    }

    return contractedHoursMap;
  }
}

