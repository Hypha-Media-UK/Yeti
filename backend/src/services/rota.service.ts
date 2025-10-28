import { StaffMember, StaffMemberWithShift } from '../../shared/types/staff';
import { ShiftAssignment, DayRota, ManualAssignment, ShiftType, ShiftStatus } from '../../shared/types/shift';
import { StaffRepository } from '../repositories/staff.repository';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { OverrideRepository } from '../repositories/override.repository';
import { ConfigRepository } from '../repositories/config.repository';
import { AllocationRepository } from '../repositories/allocation.repository';
import { StaffContractedHoursRepository } from '../repositories/staff-contracted-hours.repository';
import { AbsenceRepository } from '../repositories/absence.repository';
import { daysBetween, formatLocalDate, formatLocalTime, addDaysLocal, parseLocalDate } from '../utils/date.utils';
import { SHIFT_TIMES, CYCLE_LENGTHS } from '../config/constants';

export class RotaService {
  private staffRepo: StaffRepository;
  private scheduleRepo: ScheduleRepository;
  private overrideRepo: OverrideRepository;
  private configRepo: ConfigRepository;
  private allocationRepo: AllocationRepository;
  private contractedHoursRepo: StaffContractedHoursRepository;
  private absenceRepo: AbsenceRepository;

  constructor() {
    this.staffRepo = new StaffRepository();
    this.scheduleRepo = new ScheduleRepository();
    this.overrideRepo = new OverrideRepository();
    this.configRepo = new ConfigRepository();
    this.allocationRepo = new AllocationRepository();
    this.contractedHoursRepo = new StaffContractedHoursRepository();
    this.absenceRepo = new AbsenceRepository();
  }

  /**
   * Calculate if a staff member is on duty for a given date based on their cycle
   * Now uses shift.type instead of staff.group
   */
  private isStaffOnDuty(
    staff: StaffMemberWithShift,
    targetDate: string,
    appZeroDate: string
  ): { onDuty: boolean; shiftType: ShiftType | null } {
    // Relief staff are only on duty via manual assignments
    if (staff.status === 'Relief') {
      return { onDuty: false, shiftType: null };
    }

    const daysSinceZero = daysBetween(appZeroDate, targetDate);
    const adjustedDays = daysSinceZero - staff.daysOffset;

    if (staff.status === 'Supervisor') {
      // Supervisor pattern: 4 days / 4 off / 4 nights / 4 off (16-day cycle)
      const cyclePosition = ((adjustedDays % CYCLE_LENGTHS.SUPERVISOR) + CYCLE_LENGTHS.SUPERVISOR) % CYCLE_LENGTHS.SUPERVISOR;

      if (cyclePosition < 4) {
        // Days 0-3: Day shift
        return { onDuty: true, shiftType: 'day' };
      } else if (cyclePosition >= 8 && cyclePosition < 12) {
        // Days 8-11: Night shift
        return { onDuty: true, shiftType: 'night' };
      } else {
        // Days 4-7 and 12-15: Off
        return { onDuty: false, shiftType: null };
      }
    }

    if (staff.status === 'Regular' && staff.cycleType === '4-on-4-off') {
      // Regular pattern: 4 on / 4 off (8-day cycle)
      const cyclePosition = ((adjustedDays % CYCLE_LENGTHS.REGULAR) + CYCLE_LENGTHS.REGULAR) % CYCLE_LENGTHS.REGULAR;

      if (cyclePosition < 4) {
        // Days 0-3: On duty
        const shiftType = staff.shift?.type || null;
        return { onDuty: true, shiftType };
      } else {
        // Days 4-7: Off
        return { onDuty: false, shiftType: null };
      }
    }

    return { onDuty: false, shiftType: null };
  }

  /**
   * Check if a staff member has permanent area allocations
   * Staff with permanent allocations should NOT appear in shift pools
   */
  private async hasPermanentAllocations(staffId: number): Promise<boolean> {
    const allocations = await this.allocationRepo.findByStaffId(staffId);
    return allocations.length > 0;
  }

  /**
   * Get the default shift times for a shift type
   * TODO: Make this configurable via config table
   */
  private async getDefaultShiftTimes(shiftType: ShiftType): Promise<{ start: string; end: string }> {
    // Try to get from config first
    const dayStart = await this.configRepo.getByKey('day_shift_start');
    const dayEnd = await this.configRepo.getByKey('day_shift_end');
    const nightStart = await this.configRepo.getByKey('night_shift_start');
    const nightEnd = await this.configRepo.getByKey('night_shift_end');

    if (shiftType === 'day') {
      return {
        start: dayStart || SHIFT_TIMES.DAY.START,
        end: dayEnd || SHIFT_TIMES.DAY.END
      };
    } else {
      return {
        start: nightStart || SHIFT_TIMES.NIGHT.START,
        end: nightEnd || SHIFT_TIMES.NIGHT.END
      };
    }
  }

  /**
   * Get shift times for a specific staff member on a specific date
   * Priority: 1) Custom shift times, 2) Contracted hours for the day, 3) Default shift times
   */
  private async getShiftTimesForStaff(staff: StaffMemberWithShift, shiftType: ShiftType, targetDate: string): Promise<{ start: string; end: string } | null> {
    // Check if staff has custom shift times
    if (staff.customShiftStart && staff.customShiftEnd) {
      return {
        start: staff.customShiftStart,
        end: staff.customShiftEnd
      };
    }

    // Check if staff has contracted hours for this specific day
    const contractedHours = await this.contractedHoursRepo.findByStaff(staff.id);
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

    // Fall back to default shift times
    return this.getDefaultShiftTimes(shiftType);
  }

  /**
   * Calculate shift status based on current time and shift hours
   * Returns 'active', 'pending', or 'expired'
   * Status only applies when we're within the shift's general operating window
   */
  private calculateShiftStatus(targetDate: string, shiftStart: string, shiftEnd: string, shiftType: ShiftType): ShiftStatus {
    const now = new Date();
    const today = formatLocalDate(now);

    // If the target date is not today, we can't determine real-time status
    // Return 'active' as default for past/future dates
    if (targetDate !== today) {
      return 'active';
    }

    // Parse current time as minutes since midnight
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Parse shift times (format: "HH:MM" or "HH:MM:SS")
    const parseTime = (timeStr: string): number => {
      const parts = timeStr.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    // Get default shift times to determine if we're in the shift's operating window
    const defaultTimes = this.getDefaultShiftTimesSync(shiftType);
    const shiftWindowStart = parseTime(defaultTimes.start);
    const shiftWindowEnd = parseTime(defaultTimes.end);

    // Check if we're currently within the shift's operating window
    let inShiftWindow = false;
    if (shiftWindowEnd < shiftWindowStart) {
      // Night shift crosses midnight
      inShiftWindow = currentMinutes >= shiftWindowStart || currentMinutes < shiftWindowEnd;
    } else {
      // Day shift
      inShiftWindow = currentMinutes >= shiftWindowStart && currentMinutes < shiftWindowEnd;
    }

    // If we're not in the shift window, return 'active' (default shift color)
    if (!inShiftWindow) {
      return 'active';
    }

    // We're in the shift window, so apply status based on individual staff hours
    const startMinutes = parseTime(shiftStart);
    const endMinutes = parseTime(shiftEnd);

    // Check if individual staff hours cross midnight
    if (endMinutes < startMinutes) {
      // Overnight shift (e.g., 13:00 - 01:00)
      if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
        return 'active'; // Currently working
      } else {
        return 'pending'; // Between end and start (e.g., 02:00-12:59 for 13:00-01:00 shift)
      }
    } else {
      // Normal shift within same day
      if (currentMinutes < startMinutes) {
        return 'pending'; // Shift hasn't started yet
      } else if (currentMinutes >= endMinutes) {
        return 'expired'; // Shift has ended
      } else {
        return 'active'; // Currently working
      }
    }
  }

  /**
   * Synchronous version of getDefaultShiftTimes for use in calculateShiftStatus
   */
  private getDefaultShiftTimesSync(shiftType: ShiftType): { start: string; end: string } {
    if (shiftType === 'day') {
      return { start: '08:00', end: '20:00' };
    } else {
      return { start: '20:00', end: '08:00' };
    }
  }

  /**
   * Check if a night shift overlaps with a given date
   * Night shifts run 20:00 to 08:00, so they span two calendar days
   */
  private doesNightShiftOverlapDate(shiftStartDate: string, targetDate: string): boolean {
    // Night shift starts on shiftStartDate at 20:00 and ends on shiftStartDate+1 at 08:00
    // It overlaps targetDate if:
    // 1. targetDate === shiftStartDate (the night it starts)
    // 2. targetDate === shiftStartDate + 1 day (the morning it ends)
    
    const nextDay = formatLocalDate(addDaysLocal(shiftStartDate, 1));
    return targetDate === shiftStartDate || targetDate === nextDay;
  }

  /**
   * Get all shifts for a specific date
   */
  async getRotaForDate(targetDate: string): Promise<DayRota> {
    const appZeroDate = await this.configRepo.getByKey('app_zero_date');
    if (!appZeroDate) {
      throw new Error('App zero date not configured');
    }

    const allStaff = await this.staffRepo.findAllWithShifts();
    const manualAssignments = await this.overrideRepo.findByDate(targetDate);

    // Also get manual assignments for the previous day (for night shifts that started yesterday)
    const previousDate = formatLocalDate(addDaysLocal(targetDate, -1));
    const previousDayAssignments = await this.overrideRepo.findByDate(previousDate);

    const dayShifts: ShiftAssignment[] = [];
    const nightShifts: ShiftAssignment[] = [];

    // Track which staff have manual assignments for this date
    const manuallyAssignedStaffIds = new Set<number>();

    // Process manual assignments for the target date
    for (const assignment of manualAssignments) {
      const staff = allStaff.find(s => s.id === assignment.staffId);
      if (!staff) continue;

      // CRITICAL: Skip temporary area assignments
      // Temporary area assignments have areaType and areaId set
      // They should ONLY appear in the specific area card, NOT in shift pools
      if (assignment.areaType && assignment.areaId) {
        // This is a temporary area assignment, not a shift pool assignment
        // Mark as manually assigned so they don't get cycle-based shifts
        manuallyAssignedStaffIds.add(staff.id);
        continue;
      }

      manuallyAssignedStaffIds.add(staff.id);

      const times = await this.getShiftTimesForStaff(staff, assignment.shiftType, targetDate);
      if (!times) continue; // Staff doesn't work on this day based on contracted hours

      const shiftStart = formatLocalTime(assignment.shiftStart || times.start);
      const shiftEnd = formatLocalTime(assignment.shiftEnd || times.end);

      const shiftAssignment: ShiftAssignment = {
        staff,
        shiftType: assignment.shiftType,
        shiftStart,
        shiftEnd,
        isManualAssignment: true,
        isFixedSchedule: false,
        assignmentDate: targetDate,
        status: this.calculateShiftStatus(targetDate, shiftStart, shiftEnd, assignment.shiftType),
      };

      if (assignment.shiftType === 'day') {
        dayShifts.push(shiftAssignment);
      } else {
        nightShifts.push(shiftAssignment);
      }
    }

    // Process manual night shift assignments from previous day that overlap into target date
    for (const assignment of previousDayAssignments) {
      if (assignment.shiftType !== 'night') continue;

      // Skip temporary area assignments (same logic as above)
      if (assignment.areaType && assignment.areaId) continue;

      const staff = allStaff.find(s => s.id === assignment.staffId);
      if (!staff) continue;

      // Check if this staff member already has an assignment for the target date
      if (manuallyAssignedStaffIds.has(staff.id)) continue;

      const times = await this.getDefaultShiftTimes('night');
      const shiftStart = formatLocalTime(assignment.shiftStart || times.start);
      const shiftEnd = formatLocalTime(assignment.shiftEnd || times.end);

      const shiftAssignment: ShiftAssignment = {
        staff,
        shiftType: 'night',
        shiftStart,
        shiftEnd,
        isManualAssignment: true,
        isFixedSchedule: false,
        assignmentDate: previousDate,
        status: this.calculateShiftStatus(targetDate, shiftStart, shiftEnd, 'night'),
      };

      nightShifts.push(shiftAssignment);
    }

    // Process calculated shifts for staff without manual assignments
    for (const staff of allStaff) {
      if (manuallyAssignedStaffIds.has(staff.id)) continue;

      // CRITICAL: Skip staff with permanent area allocations
      // They should ONLY appear in their assigned area cards, NOT in shift pools
      const hasPermanentAssignment = await this.hasPermanentAllocations(staff.id);
      if (hasPermanentAssignment) continue;

      // Check for fixed schedule
      const fixedSchedule = await this.scheduleRepo.findByStaffIdAndDate(staff.id, targetDate);
      if (fixedSchedule) {
        // Determine shift type based on times (simplified - could be enhanced)
        const shiftType: ShiftType = fixedSchedule.shiftStart >= '12:00:00' ? 'night' : 'day';
        const shiftStart = formatLocalTime(fixedSchedule.shiftStart);
        const shiftEnd = formatLocalTime(fixedSchedule.shiftEnd);

        const shiftAssignment: ShiftAssignment = {
          staff,
          shiftType,
          shiftStart,
          shiftEnd,
          isManualAssignment: false,
          isFixedSchedule: true,
          assignmentDate: targetDate,
          status: this.calculateShiftStatus(targetDate, shiftStart, shiftEnd, shiftType),
        };

        if (shiftType === 'day') {
          dayShifts.push(shiftAssignment);
        } else {
          nightShifts.push(shiftAssignment);
        }
        continue;
      }

      // Calculate based on cycle
      const dutyCheck = this.isStaffOnDuty(staff, targetDate, appZeroDate);
      if (dutyCheck.onDuty && dutyCheck.shiftType) {
        const times = await this.getShiftTimesForStaff(staff, dutyCheck.shiftType, targetDate);

        // If times is null, staff has contracted hours but not for this day - skip them
        if (!times) continue;

        const shiftStart = formatLocalTime(times.start);
        const shiftEnd = formatLocalTime(times.end);

        const shiftAssignment: ShiftAssignment = {
          staff,
          shiftType: dutyCheck.shiftType,
          shiftStart,
          shiftEnd,
          isManualAssignment: false,
          isFixedSchedule: false,
          assignmentDate: targetDate,
          status: this.calculateShiftStatus(targetDate, shiftStart, shiftEnd, dutyCheck.shiftType),
        };

        if (dutyCheck.shiftType === 'day') {
          dayShifts.push(shiftAssignment);
        } else {
          nightShifts.push(shiftAssignment);
        }
      }
    }

    // Fetch absence information for all staff in the shifts
    const allStaffIds = [
      ...dayShifts.map(s => s.staff.id),
      ...nightShifts.map(s => s.staff.id)
    ];
    const uniqueStaffIds = [...new Set(allStaffIds)];

    // Get absences for the target date (any absence that overlaps with this date)
    const absenceMap = await this.absenceRepo.findAbsencesForDate(uniqueStaffIds, targetDate);

    // Attach absence information to staff objects
    for (const shift of [...dayShifts, ...nightShifts]) {
      const absence = absenceMap.get(shift.staff.id);
      if (absence) {
        shift.staff.currentAbsence = absence;
      }
    }

    // Sort shifts by status (active, pending, expired) then by staff name
    const statusOrder: Record<ShiftStatus, number> = {
      'active': 1,
      'pending': 2,
      'expired': 3,
    };

    const sortShifts = (a: ShiftAssignment, b: ShiftAssignment) => {
      // First sort by status
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Then sort by name within same status
      const nameA = `${a.staff.lastName} ${a.staff.firstName}`;
      const nameB = `${b.staff.lastName} ${b.staff.firstName}`;
      return nameA.localeCompare(nameB);
    };

    dayShifts.sort(sortShifts);
    nightShifts.sort(sortShifts);

    return {
      date: targetDate,
      dayShifts,
      nightShifts,
    };
  }

  /**
   * Get rota for a date range
   */
  async getRotaForRange(startDate: string, endDate: string): Promise<DayRota[]> {
    const days: DayRota[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dayRota = await this.getRotaForDate(currentDate);
      days.push(dayRota);
      currentDate = formatLocalDate(addDaysLocal(currentDate, 1));
    }

    return days;
  }

  /**
   * Check if a staff member is working on a specific date based on their cycle or contracted hours
   * This is used to determine if permanently allocated staff should appear in area cards
   */
  async isStaffWorkingOnDate(staff: StaffMemberWithShift, targetDate: string): Promise<boolean> {
    // Check for manual assignments first
    const manualAssignments = await this.overrideRepo.findByStaffAndDate(staff.id, targetDate);
    if (manualAssignments.length > 0) {
      const assignment = manualAssignments[0];
      // If there's a manual assignment with shiftType, they're working
      if (assignment.shiftType) {
        return true;
      }
      // If shiftType is null, it's a day off override
      return false;
    }

    // If staff has 'No Shift' (shift_id is NULL), check contracted hours
    if (!staff.shiftId) {
      const contractedHours = await this.contractedHoursRepo.findByStaff(staff.id);
      if (contractedHours.length === 0) {
        // No contracted hours defined, so they're not working
        return false;
      }

      // Get day of week for target date (1 = Monday, 7 = Sunday)
      const dateObj = parseLocalDate(targetDate);
      const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

      // Check if they have contracted hours for this day
      return contractedHours.some(ch => ch.dayOfWeek === dayOfWeek);
    }

    // Check cycle-based schedule for staff with shifts
    const appZeroDate = await this.configRepo.getByKey('app_zero_date') || '2024-01-01';
    const daysSinceZero = daysBetween(appZeroDate, targetDate);

    if (staff.status === 'Relief') {
      // Relief staff only work when manually assigned
      return false;
    }

    const adjustedDays = daysSinceZero - (staff.daysOffset || 0);

    if (staff.status === 'Supervisor') {
      // 16-day cycle: 4 day / 4 off / 4 night / 4 off
      const cyclePosition = adjustedDays % CYCLE_LENGTHS.SUPERVISOR;
      return cyclePosition < 4 || (cyclePosition >= 8 && cyclePosition < 12);
    } else {
      // Regular staff: 4-on-4-off (8-day cycle)
      const cyclePosition = adjustedDays % CYCLE_LENGTHS.REGULAR;
      return cyclePosition < 4;
    }
  }
}

