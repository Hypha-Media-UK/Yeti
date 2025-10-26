import { StaffMember, ShiftGroup } from '@shared/types/staff';
import { ShiftAssignment, DayRota, ManualAssignment } from '@shared/types/shift';
import { StaffRepository } from '../repositories/staff.repository';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { OverrideRepository } from '../repositories/override.repository';
import { ConfigRepository } from '../repositories/config.repository';
import { daysBetween, formatLocalDate, formatLocalTime, addDaysLocal, parseLocalDate } from '../utils/date.utils';
import { SHIFT_TIMES, CYCLE_LENGTHS } from '../config/constants';

export class RotaService {
  private staffRepo: StaffRepository;
  private scheduleRepo: ScheduleRepository;
  private overrideRepo: OverrideRepository;
  private configRepo: ConfigRepository;

  constructor() {
    this.staffRepo = new StaffRepository();
    this.scheduleRepo = new ScheduleRepository();
    this.overrideRepo = new OverrideRepository();
    this.configRepo = new ConfigRepository();
  }

  /**
   * Calculate if a staff member is on duty for a given date based on their cycle
   */
  private isStaffOnDuty(
    staff: StaffMember,
    targetDate: string,
    appZeroDate: string
  ): { onDuty: boolean; shiftType: ShiftGroup | null } {
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
        return { onDuty: true, shiftType: 'Day' };
      } else if (cyclePosition >= 8 && cyclePosition < 12) {
        // Days 8-11: Night shift
        return { onDuty: true, shiftType: 'Night' };
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
        return { onDuty: true, shiftType: staff.group };
      } else {
        // Days 4-7: Off
        return { onDuty: false, shiftType: null };
      }
    }

    return { onDuty: false, shiftType: null };
  }

  /**
   * Get the default shift times for a shift type
   */
  private getDefaultShiftTimes(shiftType: ShiftGroup): { start: string; end: string } {
    if (shiftType === 'Day') {
      return { start: SHIFT_TIMES.DAY.START, end: SHIFT_TIMES.DAY.END };
    } else {
      return { start: SHIFT_TIMES.NIGHT.START, end: SHIFT_TIMES.NIGHT.END };
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

    const allStaff = await this.staffRepo.findAll();
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

      manuallyAssignedStaffIds.add(staff.id);

      const times = this.getDefaultShiftTimes(assignment.shiftType);
      const shiftAssignment: ShiftAssignment = {
        staff,
        shiftType: assignment.shiftType,
        shiftStart: formatLocalTime(assignment.shiftStart || times.start),
        shiftEnd: formatLocalTime(assignment.shiftEnd || times.end),
        isManualAssignment: true,
        isFixedSchedule: false,
        assignmentDate: targetDate,
      };

      if (assignment.shiftType === 'Day') {
        dayShifts.push(shiftAssignment);
      } else {
        nightShifts.push(shiftAssignment);
      }
    }

    // Process manual night shift assignments from previous day that overlap into target date
    for (const assignment of previousDayAssignments) {
      if (assignment.shiftType !== 'Night') continue;
      
      const staff = allStaff.find(s => s.id === assignment.staffId);
      if (!staff) continue;

      // Check if this staff member already has an assignment for the target date
      if (manuallyAssignedStaffIds.has(staff.id)) continue;

      const times = this.getDefaultShiftTimes('Night');
      const shiftAssignment: ShiftAssignment = {
        staff,
        shiftType: 'Night',
        shiftStart: formatLocalTime(assignment.shiftStart || times.start),
        shiftEnd: formatLocalTime(assignment.shiftEnd || times.end),
        isManualAssignment: true,
        isFixedSchedule: false,
        assignmentDate: previousDate,
      };

      nightShifts.push(shiftAssignment);
    }

    // Process calculated shifts for staff without manual assignments
    for (const staff of allStaff) {
      if (manuallyAssignedStaffIds.has(staff.id)) continue;

      // Check for fixed schedule
      const fixedSchedule = await this.scheduleRepo.findByStaffIdAndDate(staff.id, targetDate);
      if (fixedSchedule) {
        // Determine shift type based on times (simplified - could be enhanced)
        const shiftType: ShiftGroup = fixedSchedule.shiftStart >= '12:00:00' ? 'Night' : 'Day';
        
        const shiftAssignment: ShiftAssignment = {
          staff,
          shiftType,
          shiftStart: formatLocalTime(fixedSchedule.shiftStart),
          shiftEnd: formatLocalTime(fixedSchedule.shiftEnd),
          isManualAssignment: false,
          isFixedSchedule: true,
          assignmentDate: targetDate,
        };

        if (shiftType === 'Day') {
          dayShifts.push(shiftAssignment);
        } else {
          nightShifts.push(shiftAssignment);
        }
        continue;
      }

      // Calculate based on cycle
      const dutyCheck = this.isStaffOnDuty(staff, targetDate, appZeroDate);
      if (dutyCheck.onDuty && dutyCheck.shiftType) {
        const times = this.getDefaultShiftTimes(dutyCheck.shiftType);
        
        const shiftAssignment: ShiftAssignment = {
          staff,
          shiftType: dutyCheck.shiftType,
          shiftStart: formatLocalTime(times.start),
          shiftEnd: formatLocalTime(times.end),
          isManualAssignment: false,
          isFixedSchedule: false,
          assignmentDate: targetDate,
        };

        if (dutyCheck.shiftType === 'Day') {
          dayShifts.push(shiftAssignment);
        } else {
          nightShifts.push(shiftAssignment);
        }
      }

      // Check if staff had a night shift that started yesterday and overlaps today
      if (!dutyCheck.onDuty || dutyCheck.shiftType !== 'Night') {
        const previousDutyCheck = this.isStaffOnDuty(staff, previousDate, appZeroDate);
        if (previousDutyCheck.onDuty && previousDutyCheck.shiftType === 'Night') {
          // This night shift started yesterday and ends today
          const times = this.getDefaultShiftTimes('Night');
          
          const shiftAssignment: ShiftAssignment = {
            staff,
            shiftType: 'Night',
            shiftStart: formatLocalTime(times.start),
            shiftEnd: formatLocalTime(times.end),
            isManualAssignment: false,
            isFixedSchedule: false,
            assignmentDate: previousDate,
          };

          // Only add if not already added
          const alreadyAdded = nightShifts.some(s => s.staff.id === staff.id);
          if (!alreadyAdded) {
            nightShifts.push(shiftAssignment);
          }
        }
      }
    }

    // Sort shifts by staff name for stable ordering
    const sortShifts = (a: ShiftAssignment, b: ShiftAssignment) => {
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
}

