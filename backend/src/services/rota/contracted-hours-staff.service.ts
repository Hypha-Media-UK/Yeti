import { StaffMemberWithShift, ShiftAssignment, ShiftType, StaffContractedHours } from '../../../shared/types';
import { ShiftTimeService } from './shift-time.service';
import { ConfigRepository } from '../../repositories/config.repository';
import { SHIFT_TIMES } from '../../config/constants';

/**
 * Service for processing staff with contracted hours but no shift assignment
 * These staff should automatically appear in the shift pool on their contracted days
 */
export class ContractedHoursStaffService {
  private shiftTimeService: ShiftTimeService;
  private configRepo: ConfigRepository;

  constructor() {
    this.shiftTimeService = new ShiftTimeService();
    this.configRepo = new ConfigRepository();
  }

  /**
   * Process staff with contracted hours but no shift assignment
   * 
   * @param allStaff - All staff members
   * @param targetDate - The date to process (YYYY-MM-DD format)
   * @param manuallyAssignedStaffIds - Set of staff IDs already processed via manual assignments
   * @param contractedHoursMap - Pre-fetched contracted hours to avoid N+1 queries
   * @returns Array of shift assignments for contracted hours staff
   */
  async processContractedHoursStaff(
    allStaff: StaffMemberWithShift[],
    targetDate: string,
    manuallyAssignedStaffIds: Set<number>,
    contractedHoursMap: Map<number, StaffContractedHours[]>
  ): Promise<ShiftAssignment[]> {
    const assignments: ShiftAssignment[] = [];

    // Filter staff who have:
    // 1. No shift assignment (shift_id = NULL)
    // 2. NOT pool staff (they're handled separately)
    // 3. NOT Relief staff (they only work via manual assignments)
    // 4. Have contracted hours
    const contractedHoursStaff = allStaff.filter(staff => 
      !staff.shift &&
      !staff.isPoolStaff &&
      staff.status !== 'Relief' &&
      contractedHoursMap.has(staff.id)
    );

    console.log(`[CONTRACTED HOURS] Found ${contractedHoursStaff.length} staff with contracted hours but no shift`);

    for (const staff of contractedHoursStaff) {
      // Skip if already processed via manual assignment
      if (manuallyAssignedStaffIds.has(staff.id)) {
        continue;
      }

      // Check if they have contracted hours for this day
      const contractedHours = contractedHoursMap.get(staff.id) || [];
      const targetDayOfWeek = new Date(targetDate + 'T00:00:00Z').getUTCDay();
      const hoursForToday = contractedHours.filter(ch => ch.dayOfWeek === targetDayOfWeek);

      if (hoursForToday.length === 0) {
        continue; // No contracted hours for this day
      }

      // Determine which shift panel (day/night) based on contracted hours
      const shiftType = await this.determineShiftType(hoursForToday);

      if (shiftType) {
        // Get shift times - use contracted hours for this staff member
        const times = await this.shiftTimeService.getShiftTimesForStaff(
          staff,
          shiftType,
          targetDate,
          { contractedHoursMap }
        );

        if (times) {
          assignments.push(this.createShiftAssignment(staff, shiftType, times, targetDate));
          console.log(`[CONTRACTED HOURS] Added ${staff.firstName} ${staff.lastName} to ${shiftType} shift pool`);
        }
      }
    }

    return assignments;
  }

  /**
   * Determine which shift panel (day/night) a staff member should appear in
   * based on their contracted hours for the day
   * 
   * Logic:
   * - If contracted hours overlap more with day shift times -> Day panel
   * - If contracted hours overlap more with night shift times -> Night panel
   * - If equal overlap or no overlap -> Use start time (before 14:00 = Day, after = Night)
   * 
   * @param hoursForDay - Contracted hours for the specific day
   * @returns 'day' or 'night'
   */
  private async determineShiftType(hoursForDay: StaffContractedHours[]): Promise<ShiftType | null> {
    if (hoursForDay.length === 0) {
      return null;
    }

    // Get configured shift times
    const dayShiftStart = await this.configRepo.getByKey('day_shift_start') || SHIFT_TIMES.DAY.START;
    const dayShiftEnd = await this.configRepo.getByKey('day_shift_end') || SHIFT_TIMES.DAY.END;
    const nightShiftStart = await this.configRepo.getByKey('night_shift_start') || SHIFT_TIMES.NIGHT.START;
    const nightShiftEnd = await this.configRepo.getByKey('night_shift_end') || SHIFT_TIMES.NIGHT.END;

    // For simplicity, use the first contracted hours entry for the day
    // (Most staff will only have one entry per day)
    const contractedHour = hoursForDay[0];
    const contractedStart = this.timeToMinutes(contractedHour.startTime);
    const contractedEnd = this.timeToMinutes(contractedHour.endTime);

    const dayStart = this.timeToMinutes(dayShiftStart);
    const dayEnd = this.timeToMinutes(dayShiftEnd);
    const nightStart = this.timeToMinutes(nightShiftStart);
    const nightEnd = this.timeToMinutes(nightShiftEnd);

    // Calculate overlap with day shift
    const dayOverlap = this.calculateOverlap(contractedStart, contractedEnd, dayStart, dayEnd);

    // Calculate overlap with night shift (handles overnight shifts)
    let nightOverlap = 0;
    if (nightStart > nightEnd) {
      // Night shift crosses midnight (e.g., 20:00 - 08:00)
      // Split into two ranges: nightStart to midnight, and midnight to nightEnd
      const midnightMinutes = 24 * 60;
      nightOverlap = this.calculateOverlap(contractedStart, contractedEnd, nightStart, midnightMinutes);
      nightOverlap += this.calculateOverlap(contractedStart, contractedEnd, 0, nightEnd);
    } else {
      nightOverlap = this.calculateOverlap(contractedStart, contractedEnd, nightStart, nightEnd);
    }

    console.log(`[CONTRACTED HOURS] Contracted: ${contractedHour.startTime}-${contractedHour.endTime}, Day overlap: ${dayOverlap}min, Night overlap: ${nightOverlap}min`);

    // Determine shift type based on overlap
    if (dayOverlap > nightOverlap) {
      return 'day';
    } else if (nightOverlap > dayOverlap) {
      return 'night';
    } else {
      // Equal overlap or no overlap - use start time as tiebreaker
      // If starts before 14:00 (2pm), consider it day shift
      return contractedStart < 14 * 60 ? 'day' : 'night';
    }
  }

  /**
   * Convert time string (HH:mm or HH:mm:ss) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  }

  /**
   * Calculate overlap in minutes between two time ranges
   */
  private calculateOverlap(start1: number, end1: number, start2: number, end2: number): number {
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    return Math.max(0, overlapEnd - overlapStart);
  }

  /**
   * Create a shift assignment object
   */
  private createShiftAssignment(
    staff: StaffMemberWithShift,
    shiftType: ShiftType,
    times: { start: string; end: string },
    date: string
  ): ShiftAssignment {
    return {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      status: staff.status,
      shiftType,
      shiftStart: times.start,
      shiftEnd: times.end,
      date,
      isPoolStaff: false, // They're not pool staff, just appearing in pool due to contracted hours
      earlyFinishDay: staff.earlyFinishDay || null,
      currentAbsence: null,
    };
  }
}

