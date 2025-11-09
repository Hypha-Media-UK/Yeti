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
import { daysBetween } from '../utils/date.utils';

// Import specialized services
import { CycleCalculationService } from './rota/cycle-calculation.service';
import { ShiftTimeService } from './rota/shift-time.service';
import { PoolStaffService } from './rota/pool-staff.service';
import { ManualAssignmentService } from './rota/manual-assignment.service';
import { ContractedHoursStaffService } from './rota/contracted-hours-staff.service';

/**
 * RotaService (Refactored)
 *
 * Main orchestrator for rota operations.
 * Delegates specialized logic to focused services:
 * - CycleCalculationService: Shift cycle calculations
 * - ShiftTimeService: Shift time calculations
 * - PoolStaffService: Pool staff processing
 * - ManualAssignmentService: Manual assignment processing
 * - ContractedHoursStaffService: Staff with contracted hours but no shift
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
  private contractedHoursStaffService: ContractedHoursStaffService;

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
    this.contractedHoursStaffService = new ContractedHoursStaffService();
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

    // Get all supervisors (they don't have shifts anymore)
    const allSupervisors = await this.staffRepo.findAll({ status: 'Supervisor' });
    console.log(`[ROTA] Found ${allSupervisors.length} supervisors`);

    // Get staff with no shift assignment (they might have contracted hours)
    const staffWithNoShift = await this.staffRepo.findStaffWithNoShift();
    console.log(`[ROTA] Found ${staffWithNoShift.length} staff with no shift assignment`);

    // Combine all staff
    const allStaff = [...staffInActiveShifts, ...allSupervisors, ...staffWithNoShift];

    // Get manual assignments for current day only
    const manualAssignments = await this.manualAssignmentService.getManualAssignmentsForDate(targetDate);

    // Fetch staff for manual assignments (they might not be in active shifts or supervisors)
    const manualStaffMap = await this.fetchManualAssignmentStaff(
      manualAssignments,
      allStaff
    );

    // Pre-fetch contracted hours for all staff
    const contractedHoursMap = await this.fetchContractedHours(
      allStaff,
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

    // 2. Process cycle-based staff (excluding pool staff and manually assigned)
    const cycleBasedAssignments = await this.processCycleBasedStaff(
      allStaff,
      targetDate,
      appZeroDate,
      contractedHoursMap,
      manuallyAssignedStaffIds
    );
    this.categorizeShifts(cycleBasedAssignments, dayShifts, nightShifts);

    // 3. Process pool staff
    const poolStaffAssignments = await this.poolStaffService.processPoolStaff(
      targetDate,
      appZeroDate,
      manuallyAssignedStaffIds,
      contractedHoursMap
    );
    this.categorizeShifts(poolStaffAssignments, dayShifts, nightShifts);

    // 4. Process staff with contracted hours but no shift assignment
    // Fetch all permanent allocations to exclude staff who are permanently assigned
    const allAllocations = await this.allocationRepo.findAll();
    const permanentlyAssignedStaffIds = new Set(allAllocations.map(a => a.staffId));

    const contractedHoursAssignments = await this.contractedHoursStaffService.processContractedHoursStaff(
      allStaff,
      targetDate,
      manuallyAssignedStaffIds,
      permanentlyAssignedStaffIds,
      contractedHoursMap
    );
    this.categorizeShifts(contractedHoursAssignments, dayShifts, nightShifts);

    // 5. Get yesterday's night shift staff if still active (for task assignment only)
    // Night shifts typically run 20:00-08:00, so yesterday's night shift extends into today
    // We DON'T add them to dayShifts or nightShifts to keep the rota display clean
    const previousNightShift = await this.getYesterdayNightShiftIfActive(
      targetDate,
      appZeroDate,
      contractedHoursMap,
      manuallyAssignedStaffIds
    );

    // 6. Mark staff who have area allocations
    // This allows the frontend to display them in a separate "Allocated" section in the pool
    this.markAllocatedStaff(dayShifts, nightShifts, permanentlyAssignedStaffIds);

    // 7. Attach absence information
    await this.attachAbsenceInfo(dayShifts, nightShifts, targetDate);

    // 8. Sort shifts
    this.sortShifts(dayShifts, targetDate, appZeroDate);
    this.sortShifts(nightShifts, targetDate, appZeroDate);

    const endTime = Date.now();
    console.log(`[ROTA] Completed in ${endTime - startTime}ms (${dayShifts.length} day, ${nightShifts.length} night, ${previousNightShift.length} previous night)`);

    return {
      date: targetDate,
      dayShifts,
      nightShifts,
      previousNightShift,
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

      // If they have contracted hours for this day, they're working
      if (hasHours) {
        return true;
      }

      // If no contracted hours but they have a reference shift, check the reference shift cycle
      // This handles staff with use_cycle_for_permanent=false but no contracted hours set up yet
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

      // No contracted hours and no reference shift - not working
      return false;
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

    // Default: Use shift cycle pattern (if staff has a shift)
    if (staff.shift) {
      const appZeroDate = options?.appZeroDate || await this.getAppZeroDate();
      return this.cycleService.isStaffWorkingOnDateByCycle(staff, targetDate, appZeroDate);
    }

    // Staff has no shift, no reference shift, and no contracted hours - not working
    return false;
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
   * Get yesterday's night shift staff if they're still working today
   * Night shifts run 20:00-08:00, so yesterday's night shift extends into today until 08:00
   */
  private async getYesterdayNightShiftIfActive(
    targetDate: string,
    appZeroDate: string,
    contractedHoursMap: Map<number, StaffContractedHours[]>,
    manuallyAssignedStaffIds: Set<number>
  ): Promise<ShiftAssignment[]> {
    const assignments: ShiftAssignment[] = [];

    // Calculate yesterday's date
    const yesterday = formatLocalDate(addDaysLocal(targetDate, -1));

    // Get yesterday's active shifts
    const allShifts = await this.shiftRepo.findAll(true);
    const yesterdayActiveShifts = this.cycleService.calculateActiveShifts(yesterday, appZeroDate, allShifts);
    const yesterdayActiveShiftIds = yesterdayActiveShifts.map(s => s.id);

    // Get staff in yesterday's active shifts
    const yesterdayStaff = await this.staffRepo.findByShiftIds(yesterdayActiveShiftIds);

    // Also get supervisors
    const allSupervisors = await this.staffRepo.findAll({ status: 'Supervisor' });
    const allYesterdayStaff = [...yesterdayStaff, ...allSupervisors];

    // Process each staff member to see if they worked night shift yesterday
    for (const staff of allYesterdayStaff) {
      // Skip if already manually assigned today
      if (manuallyAssignedStaffIds.has(staff.id)) continue;

      // Skip pool staff (they're processed separately)
      if (staff.isPoolStaff) continue;

      // Check if they were on duty yesterday
      const dutyCheck = this.cycleService.isStaffOnDuty(staff, yesterday, appZeroDate);

      // Only include if they worked NIGHT shift yesterday
      if (dutyCheck.onDuty && dutyCheck.shiftType === 'night') {
        const times = await this.shiftTimeService.getShiftTimesForStaff(
          staff,
          'night',
          yesterday,
          { contractedHoursMap, appZeroDate }
        );

        if (times) {
          // Create assignment with yesterday's date but check if it's still active TODAY
          const assignment = this.createShiftAssignment(staff, 'night', times, yesterday, false);

          // Only include if the shift is still active (not expired)
          // The shift status is calculated based on current time vs shift hours
          if (assignment.status === 'active') {
            assignments.push(assignment);
          }
        }
      }
    }

    console.log(`[ROTA] Found ${assignments.length} night shift staff from yesterday still working`);
    return assignments;
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

    // Handle overnight shifts: if end time is before start time, the shift ends the next day
    let shiftEnd: Date;
    const startMinutes = this.timeToMinutes(times.start);
    const endMinutes = this.timeToMinutes(times.end);

    if (endMinutes < startMinutes) {
      // Overnight shift - end time is on the next day
      const nextDay = new Date(shiftStart);
      nextDay.setDate(nextDay.getDate() + 1);
      shiftEnd = new Date(`${nextDay.toISOString().split('T')[0]}T${times.end}`);
    } else {
      // Same-day shift
      shiftEnd = new Date(`${targetDate}T${times.end}`);
    }

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
   * Convert time string (HH:mm or HH:mm:ss) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
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
   * Mark staff who have area allocations (departments/services)
   * This allows the frontend to display them in a separate "Allocated" section
   */
  private markAllocatedStaff(
    dayShifts: ShiftAssignment[],
    nightShifts: ShiftAssignment[],
    permanentlyAssignedStaffIds: Set<number>
  ): void {
    for (const shift of [...dayShifts, ...nightShifts]) {
      if (permanentlyAssignedStaffIds.has(shift.staff.id)) {
        shift.hasAreaAllocation = true;
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
   * Sort shifts by status, staff type (supervisors first), supervisor offset, shift offset, and name
   *
   * Supervisors are now first-class citizens with their own supervisor_offset field.
   * They are sorted separately from regular staff and don't need complex offset mapping.
   */
  private sortShifts(shifts: ShiftAssignment[], targetDate: string, appZeroDate: string): void {
    const statusOrder: Record<ShiftStatus, number> = {
      'active': 1,
      'pending': 2,
      'expired': 3,
    };

    shifts.sort((a, b) => {
      // 1. Sort by status (active, pending, expired)
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // 2. Sort by staff type - Supervisors first
      const aIsSupervisor = a.staff.status === 'Supervisor';
      const bIsSupervisor = b.staff.status === 'Supervisor';
      if (aIsSupervisor && !bIsSupervisor) return -1;
      if (!aIsSupervisor && bIsSupervisor) return 1;

      // 3. Sort by offset
      // For supervisors: Use supervisor_offset (0, 4, 8, 12)
      // For regular staff: Use personal offset if set AND non-zero, otherwise use shift's offset
      let aOffset: number;
      let bOffset: number;

      if (a.staff.status === 'Supervisor') {
        aOffset = a.staff.supervisorOffset ?? 0;
      } else {
        aOffset = (a.staff.daysOffset !== null && a.staff.daysOffset !== undefined && a.staff.daysOffset !== 0)
          ? a.staff.daysOffset
          : (a.staff.shift?.daysOffset || 0);
      }

      if (b.staff.status === 'Supervisor') {
        bOffset = b.staff.supervisorOffset ?? 0;
      } else {
        bOffset = (b.staff.daysOffset !== null && b.staff.daysOffset !== undefined && b.staff.daysOffset !== 0)
          ? b.staff.daysOffset
          : (b.staff.shift?.daysOffset || 0);
      }

      if (aOffset !== bOffset) return aOffset - bOffset;

      // 4. Sort by name (alphabetically)
      const nameA = `${a.staff.lastName} ${a.staff.firstName}`;
      const nameB = `${b.staff.lastName} ${b.staff.firstName}`;
      return nameA.localeCompare(nameB);
    });
  }
}

