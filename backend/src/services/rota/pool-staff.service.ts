import { StaffMemberWithShift } from '../../../shared/types/staff';
import { ShiftType, ShiftAssignment, ShiftStatus } from '../../../shared/types/shift';
import { StaffContractedHours } from '../../../shared/types/operational-hours';
import { StaffRepository } from '../../repositories/staff.repository';
import { CycleCalculationService } from './cycle-calculation.service';
import { ShiftTimeService } from './shift-time.service';
import { formatLocalTime } from '../../utils/date.utils';

/**
 * PoolStaffService
 * 
 * Responsible for processing pool staff:
 * - Pool staff appear in shift panels alongside shift-based staff
 * - They work their contracted hours, not shift cycles (if useContractedHoursForShift = true)
 * - Shift assignment determines which panel (day/night) they appear in
 * 
 * Pool staff are flexible workers who:
 * - Don't follow standard shift cycles
 * - Work specific contracted hours
 * - Need to appear in the main rota shift panels
 */
export class PoolStaffService {
  private staffRepo: StaffRepository;
  private cycleService: CycleCalculationService;
  private shiftTimeService: ShiftTimeService;

  constructor(
    staffRepo: StaffRepository,
    cycleService: CycleCalculationService,
    shiftTimeService: ShiftTimeService
  ) {
    this.staffRepo = staffRepo;
    this.cycleService = cycleService;
    this.shiftTimeService = shiftTimeService;
  }

  /**
   * Process pool staff for a specific date
   * 
   * @param targetDate - The date to process (YYYY-MM-DD format)
   * @param appZeroDate - The app's zero date reference point
   * @param manuallyAssignedStaffIds - Set of staff IDs already processed via manual assignments
   * @param contractedHoursMap - Pre-fetched contracted hours to avoid N+1 queries
   * @returns Array of shift assignments for pool staff
   */
  async processPoolStaff(
    targetDate: string,
    appZeroDate: string,
    manuallyAssignedStaffIds: Set<number>,
    contractedHoursMap: Map<number, StaffContractedHours[]>
  ): Promise<ShiftAssignment[]> {
    const poolStaffAssignments: ShiftAssignment[] = [];

    // Get all pool staff
    const poolStaff = await this.staffRepo.findAllWithShifts({ isPoolStaff: true });
    console.log(`[POOL] Found ${poolStaff.length} pool staff`);

    for (const staff of poolStaff) {
      // Skip if already processed via manual assignment
      if (manuallyAssignedStaffIds.has(staff.id)) {
        continue;
      }

      // Determine if pool staff is on duty and which shift type
      const dutyInfo = await this.isPoolStaffOnDuty(
        staff,
        targetDate,
        appZeroDate,
        contractedHoursMap
      );

      if (dutyInfo.onDuty && dutyInfo.shiftType) {
        // Get shift times for this pool staff member
        const times = await this.shiftTimeService.getShiftTimesForStaff(
          staff,
          dutyInfo.shiftType,
          targetDate,
          { contractedHoursMap }
        );

        if (times) {
          const now = new Date();
          const shiftStart = new Date(`${targetDate}T${times.start}`);
          const shiftEnd = new Date(`${targetDate}T${times.end}`);

          let status: ShiftStatus = 'active';
          if (now < shiftStart) {
            status = 'pending';
          } else if (now > shiftEnd) {
            status = 'expired';
          }

          poolStaffAssignments.push({
            staff,
            shiftType: dutyInfo.shiftType,
            shiftStart: formatLocalTime(times.start),
            shiftEnd: formatLocalTime(times.end),
            status,
            isManualAssignment: false,
            isFixedSchedule: false,
            assignmentDate: targetDate,
          });
        }
      }
    }

    console.log(`[POOL] Processed ${poolStaffAssignments.length} pool staff assignments`);
    return poolStaffAssignments;
  }

  /**
   * Determine if a pool staff member is on duty for a specific date
   * 
   * Pool staff can work in two ways:
   * 1. Via contracted hours (useContractedHoursForShift = true)
   * 2. Via shift cycle (useContractedHoursForShift = false)
   * 
   * @param staff - Pool staff member
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @param appZeroDate - The app's zero date reference point
   * @param contractedHoursMap - Pre-fetched contracted hours
   * @returns Object with onDuty status and shift type
   */
  private async isPoolStaffOnDuty(
    staff: StaffMemberWithShift,
    targetDate: string,
    appZeroDate: string,
    contractedHoursMap: Map<number, StaffContractedHours[]>
  ): Promise<{ onDuty: boolean; shiftType: ShiftType | null }> {
    let onDuty = false;
    let shiftType: ShiftType | null = null;

    if (staff.useContractedHoursForShift) {
      // Pool staff using contracted hours: check if they have hours for today
      const contractedHours = contractedHoursMap.get(staff.id) || [];

      // Check if they have contracted hours for this day of week
      const targetDayOfWeek = new Date(targetDate + 'T00:00:00Z').getUTCDay();
      const hasHoursToday = contractedHours.some(ch => ch.dayOfWeek === targetDayOfWeek);

      if (hasHoursToday && staff.shift?.type) {
        onDuty = true;
        shiftType = staff.shift.type; // Use shift assignment to determine day/night panel
      }
    } else {
      // Pool staff using shift cycle: check if they're on duty based on cycle
      const dutyCheck = this.cycleService.isStaffOnDuty(staff, targetDate, appZeroDate);
      onDuty = dutyCheck.onDuty;
      shiftType = dutyCheck.shiftType;
    }

    return { onDuty, shiftType };
  }

  /**
   * Check if a staff member is pool staff
   * 
   * @param staff - Staff member to check
   * @returns True if staff is pool staff
   */
  isPoolStaff(staff: StaffMemberWithShift): boolean {
    return staff.isPoolStaff === true;
  }
}

