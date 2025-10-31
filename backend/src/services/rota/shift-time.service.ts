import { StaffMemberWithShift } from '../../../shared/types/staff';
import { ShiftType } from '../../../shared/types/shift';
import { StaffContractedHours } from '../../../shared/types/operational-hours';
import { StaffContractedHoursRepository } from '../../repositories/staff-contracted-hours.repository';
import { parseLocalDate } from '../../utils/date.utils';
import { SHIFT_TIMES } from '../../config/constants';

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
   * Get shift times for a specific staff member on a specific date
   * 
   * Priority:
   * 1. Custom shift times (staff.customShiftStart/End)
   * 2. Contracted hours for the day
   * 3. Default shift times
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
    return this.getDefaultShiftTimes(shiftType);
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

