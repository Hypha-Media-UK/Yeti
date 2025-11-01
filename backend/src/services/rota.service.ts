import { StaffMember, StaffMemberWithShift } from '../../shared/types/staff';
import { ShiftAssignment, DayRota, ManualAssignment, ShiftType, ShiftStatus, Shift } from '../../shared/types/shift';
import { StaffContractedHours } from '../../shared/types/operational-hours';
import { StaffRepository } from '../repositories/staff.repository';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { ConfigRepository } from '../repositories/config.repository';
import { AllocationRepository } from '../repositories/allocation.repository';
import { AbsenceRepository } from '../repositories/absence.repository';
import { ShiftRepository } from '../repositories/shift.repository';
import { formatLocalDate, addDaysLocal } from '../utils/date.utils';

// Import specialized services
import { CycleCalculationService } from './rota/cycle-calculation.service';
import { ShiftTimeService } from './rota/shift-time.service';
import { PoolStaffService } from './rota/pool-staff.service';
import { ManualAssignmentService } from './rota/manual-assignment.service';

/**
 * RotaService (Refactored)
 * 
 * Main orchestrator for rota operations.
 * Delegates specialized logic to focused services:
 * - CycleCalculationService: Shift cycle calculations
 * - ShiftTimeService: Shift time calculations
 * - PoolStaffService: Pool staff processing
 * - ManualAssignmentService: Manual assignment processing
 * 
 * This service coordinates between these services and handles:
 * - Data fetching and caching
 * - Orchestration of the rota generation process
 * - Absence integration
 * - Sorting and final assembly
 */
export class RotaService {
  // Repositories
  private staffRepo: StaffRepository;
  private scheduleRepo: ScheduleRepository;
  private configRepo: ConfigRepository;
  private allocationRepo: AllocationRepository;
  private absenceRepo: AbsenceRepository;
  private shiftRepo: ShiftRepository;

  // Specialized services
  private cycleService: CycleCalculationService;
  private shiftTimeService: ShiftTimeService;
  private poolStaffService: PoolStaffService;
  private manualAssignmentService: ManualAssignmentService;

  constructor() {
    // Initialize repositories
    this.staffRepo = new StaffRepository();
    this.scheduleRepo = new ScheduleRepository();
    this.configRepo = new ConfigRepository();
    this.allocationRepo = new AllocationRepository();
    this.absenceRepo = new AbsenceRepository();
    this.shiftRepo = new ShiftRepository();

    // Initialize specialized services
    this.cycleService = new CycleCalculationService();
    this.shiftTimeService = new ShiftTimeService();
    this.poolStaffService = new PoolStaffService(this.staffRepo, this.cycleService, this.shiftTimeService);
    this.manualAssignmentService = new ManualAssignmentService(this.shiftTimeService);
  }

  /**
   * Get all shifts for a specific date
   * PERFORMANCE OPTIMIZED: Uses shift-based filtering instead of looping through all staff
   */
  async getRotaForDate(targetDate: string): Promise<DayRota> {
    const startTime = Date.now();
    console.log(`[ROTA] getRotaForDate started for ${targetDate}`);

    // Get app zero date
    const appZeroDate = await this.configRepo.getByKey('app_zero_date');
    if (!appZeroDate) {
      throw new Error('App zero date not configured');
    }

    // Calculate which shifts are active on this date
    const allShifts = await this.shiftRepo.findAll(true);
    const activeShifts = this.cycleService.calculateActiveShifts(targetDate, appZeroDate, allShifts);
    const activeShiftIds = activeShifts.map(s => s.id);

    console.log(`[ROTA] Found ${activeShifts.length} active shifts: ${activeShifts.map(s => s.name).join(', ')}`);

    // Get staff in active shifts
    const staffInActiveShifts = await this.staffRepo.findByShiftIds(activeShiftIds);
    console.log(`[ROTA] Found ${staffInActiveShifts.length} staff in active shifts`);

    // Get manual assignments for current day only
    const manualAssignments = await this.manualAssignmentService.getManualAssignmentsForDate(targetDate);

    // Fetch staff for manual assignments (they might not be in active shifts)
    const manualStaffMap = await this.fetchManualAssignmentStaff(
      manualAssignments,
      staffInActiveShifts
    );

    // Pre-fetch contracted hours for all staff
    const contractedHoursMap = await this.fetchContractedHours(
      staffInActiveShifts,
      manualStaffMap
    );

    // Process shifts
    const dayShifts: ShiftAssignment[] = [];
    const nightShifts: ShiftAssignment[] = [];
    const manuallyAssignedStaffIds = new Set<number>();

    // 1. Process manual assignments
    const manualAssignmentResults = await this.manualAssignmentService.processManualAssignments(
      manualAssignments,
      manualStaffMap,
      targetDate,
      contractedHoursMap,
      manuallyAssignedStaffIds,
      appZeroDate
    );
    this.categorizeShifts(manualAssignmentResults, dayShifts, nightShifts);

    // 3. Process cycle-based staff (excluding pool staff and manually assigned)
    const cycleBasedAssignments = await this.processCycleBasedStaff(
      staffInActiveShifts,
      targetDate,
      appZeroDate,
      contractedHoursMap,
      manuallyAssignedStaffIds
    );
    this.categorizeShifts(cycleBasedAssignments, dayShifts, nightShifts);

    // 4. Process pool staff
    const poolStaffAssignments = await this.poolStaffService.processPoolStaff(
      targetDate,
      appZeroDate,
      manuallyAssignedStaffIds,
      contractedHoursMap
    );
    this.categorizeShifts(poolStaffAssignments, dayShifts, nightShifts);

    // 5. Attach absence information
    await this.attachAbsenceInfo(dayShifts, nightShifts, targetDate);

    // 6. Sort shifts
    this.sortShifts(dayShifts);
    this.sortShifts(nightShifts);

    const endTime = Date.now();
    console.log(`[ROTA] Completed in ${endTime - startTime}ms (${dayShifts.length} day, ${nightShifts.length} night)`);

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
   * Check if a staff member is on duty based on their cycle
   * This is a wrapper around CycleCalculationService.isStaffOnDuty for backward compatibility
   * @deprecated Use cycleService.isStaffOnDuty directly or isStaffWorkingOnDate for full logic
   */
  isStaffOnDuty(staff: StaffMemberWithShift, targetDate: string, appZeroDate: string) {
    return this.cycleService.isStaffOnDuty(staff, targetDate, appZeroDate);
  }

  /**
   * Check if a staff member is working on a specific date
   * Used for permanent staff allocation checks
   */
  async isStaffWorkingOnDate(
    staff: StaffMemberWithShift,
    targetDate: string,
    options?: {
      manualAssignmentsMap?: Map<number, ManualAssignment[]>;
      contractedHoursMap?: Map<number, StaffContractedHours[]>;
      appZeroDate?: string;
    }
  ): Promise<boolean> {
    // Check for manual assignments first
    const manualAssignment = await this.manualAssignmentService.getManualAssignmentForStaff(
      staff.id,
      targetDate,
      options?.manualAssignmentsMap
    );

    if (manualAssignment) {
      // If there's a manual assignment with shiftType, they're working
      if (manualAssignment.shiftType) {
        return true;
      }
      // If shiftType is null, it's a day off override
      return false;
    }

    // Check if staff uses contracted hours for permanent allocations
    if (staff.useCycleForPermanent === false) {
      // Check contracted hours
      const hasHours = await this.shiftTimeService.hasContractedHoursForDay(
        staff,
        targetDate,
        options
      );
      return hasHours;
    }

    // Check if staff has a reference shift
    if (staff.referenceShiftId) {
      const referenceShift = await this.shiftRepo.findById(staff.referenceShiftId);
      if (referenceShift) {
        const appZeroDate = options?.appZeroDate || await this.getAppZeroDate();
        return this.cycleService.isStaffWorkingOnDateByCycle(
          staff,
          targetDate,
          appZeroDate,
          referenceShift
        );
      }
    }

    // Default: Use shift cycle pattern
    const appZeroDate = options?.appZeroDate || await this.getAppZeroDate();
    return this.cycleService.isStaffWorkingOnDateByCycle(staff, targetDate, appZeroDate);
  }

  /**
   * Get manual assignments for a specific date
   */
  async getManualAssignmentsForDate(date: string): Promise<ManualAssignment[]> {
    return await this.manualAssignmentService.getManualAssignmentsForDate(date);
  }

  /**
   * Get the app zero date from config
   */
  async getAppZeroDate(): Promise<string> {
    return await this.configRepo.getByKey('app_zero_date') || '2024-01-01';
  }

  // ========== Private Helper Methods ==========

  /**
   * Fetch staff members for manual assignments
   */
  private async fetchManualAssignmentStaff(
    manualAssignments: ManualAssignment[],
    staffInActiveShifts: StaffMemberWithShift[]
  ): Promise<Map<number, StaffMemberWithShift>> {
    const manualAssignmentStaffIds = manualAssignments.map(a => a.staffId);
    const uniqueManualStaffIds = [...new Set(manualAssignmentStaffIds)];

    const manualStaffMap = new Map<number, StaffMemberWithShift>();
    for (const staffId of uniqueManualStaffIds) {
      const existingStaff = staffInActiveShifts.find(s => s.id === staffId);
      if (existingStaff) {
        manualStaffMap.set(staffId, existingStaff);
      } else {
        const staffMember = await this.staffRepo.findById(staffId);
        if (staffMember) {
          const shift = staffMember.shiftId ? await this.shiftRepo.findById(staffMember.shiftId) : null;
          manualStaffMap.set(staffId, { ...staffMember, shift });
        }
      }
    }

    return manualStaffMap;
  }

  /**
   * Pre-fetch contracted hours for all staff
   */
  private async fetchContractedHours(
    staffInActiveShifts: StaffMemberWithShift[],
    manualStaffMap: Map<number, StaffMemberWithShift>
  ): Promise<Map<number, StaffContractedHours[]>> {
    const staffIdsInActiveShifts = staffInActiveShifts.map(s => s.id);
    const manualStaffIds = Array.from(manualStaffMap.keys());
    const allStaffIds = [...new Set([...staffIdsInActiveShifts, ...manualStaffIds])];

    return await this.shiftTimeService.batchFetchContractedHours(allStaffIds);
  }

  /**
   * Process cycle-based staff (excluding pool staff and manually assigned)
   */
  private async processCycleBasedStaff(
    staffInActiveShifts: StaffMemberWithShift[],
    targetDate: string,
    appZeroDate: string,
    contractedHoursMap: Map<number, StaffContractedHours[]>,
    manuallyAssignedStaffIds: Set<number>
  ): Promise<ShiftAssignment[]> {
    const assignments: ShiftAssignment[] = [];

    for (const staff of staffInActiveShifts) {
      // Skip if already manually assigned
      if (manuallyAssignedStaffIds.has(staff.id)) continue;

      // Skip pool staff (they're processed separately)
      if (staff.isPoolStaff) continue;

      // Calculate based on cycle
      const dutyCheck = this.cycleService.isStaffOnDuty(staff, targetDate, appZeroDate);
      if (dutyCheck.onDuty && dutyCheck.shiftType) {
        const times = await this.shiftTimeService.getShiftTimesForStaff(
          staff,
          dutyCheck.shiftType,
          targetDate,
          { contractedHoursMap, appZeroDate }
        );

        if (times) {
          assignments.push(this.createShiftAssignment(staff, dutyCheck.shiftType, times, targetDate, false));
        }
      }
    }

    return assignments;
  }



  /**
   * Create a shift assignment object
   */
  private createShiftAssignment(
    staff: StaffMemberWithShift,
    shiftType: ShiftType,
    times: { start: string; end: string },
    targetDate: string,
    isManualAssignment: boolean
  ): ShiftAssignment {
    const now = new Date();
    const shiftStart = new Date(`${targetDate}T${times.start}`);
    const shiftEnd = new Date(`${targetDate}T${times.end}`);

    let status: ShiftStatus = 'active';
    if (now < shiftStart) {
      status = 'pending';
    } else if (now > shiftEnd) {
      status = 'expired';
    }

    return {
      staff,
      shiftType,
      shiftStart: times.start,
      shiftEnd: times.end,
      status,
      isManualAssignment,
      isFixedSchedule: false,
      assignmentDate: targetDate,
    };
  }

  /**
   * Categorize shifts into day and night arrays
   */
  private categorizeShifts(
    assignments: ShiftAssignment[],
    dayShifts: ShiftAssignment[],
    nightShifts: ShiftAssignment[]
  ): void {
    for (const assignment of assignments) {
      if (assignment.shiftType === 'day') {
        dayShifts.push(assignment);
      } else {
        nightShifts.push(assignment);
      }
    }
  }

  /**
   * Attach absence information to shifts
   */
  private async attachAbsenceInfo(
    dayShifts: ShiftAssignment[],
    nightShifts: ShiftAssignment[],
    targetDate: string
  ): Promise<void> {
    const allStaffIds = [
      ...dayShifts.map(s => s.staff.id),
      ...nightShifts.map(s => s.staff.id)
    ];
    const uniqueStaffIds = [...new Set(allStaffIds)];

    const absenceMap = await this.absenceRepo.findAbsencesForDate(uniqueStaffIds, targetDate);

    for (const shift of [...dayShifts, ...nightShifts]) {
      const absence = absenceMap.get(shift.staff.id);
      if (absence) {
        shift.staff.currentAbsence = absence;
      }
    }
  }

  /**
   * Sort shifts by status and name
   */
  private sortShifts(shifts: ShiftAssignment[]): void {
    const statusOrder: Record<ShiftStatus, number> = {
      'active': 1,
      'pending': 2,
      'expired': 3,
    };

    shifts.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      const nameA = `${a.staff.lastName} ${a.staff.firstName}`;
      const nameB = `${b.staff.lastName} ${b.staff.firstName}`;
      return nameA.localeCompare(nameB);
    });
  }
}

