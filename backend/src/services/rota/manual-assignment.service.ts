import { StaffMemberWithShift } from '../../../shared/types/staff';
import { ShiftAssignment, ShiftStatus, ManualAssignment } from '../../../shared/types/shift';
import { StaffContractedHours } from '../../../shared/types/operational-hours';
import { OverrideRepository } from '../../repositories/override.repository';
import { ShiftTimeService } from './shift-time.service';
import { formatLocalTime, formatLocalDate, addDaysLocal } from '../../utils/date.utils';

/**
 * ManualAssignmentService
 * 
 * Responsible for processing manual assignments:
 * - Manual assignments override cycle-based schedules
 * - Handles both shift pool assignments and temporary area assignments
 * - Processes current day and previous day (for night shifts)
 * 
 * Manual assignments can be:
 * 1. Shift pool assignments (no areaType/areaId) - appear in shift panels
 * 2. Temporary area assignments (with areaType/areaId) - appear only in area cards
 */
export class ManualAssignmentService {
  private overrideRepo: OverrideRepository;
  private shiftTimeService: ShiftTimeService;

  constructor(shiftTimeService: ShiftTimeService) {
    this.overrideRepo = new OverrideRepository();
    this.shiftTimeService = shiftTimeService;
  }

  /**
   * Get manual assignments for a specific date
   * Includes assignments from the target date and previous day (for night shifts)
   * 
   * @param targetDate - The date to get assignments for (YYYY-MM-DD format)
   * @returns Object with current and previous day assignments
   */
  async getManualAssignmentsForDate(targetDate: string): Promise<{
    currentDay: ManualAssignment[];
    previousDay: ManualAssignment[];
  }> {
    // Get manual assignments for the target date
    const currentDay = await this.overrideRepo.findByDate(targetDate);

    // Get manual assignments for the previous day (for night shifts that started yesterday)
    const previousDate = formatLocalDate(addDaysLocal(targetDate, -1));
    const previousDay = await this.overrideRepo.findByDate(previousDate);

    return { currentDay, previousDay };
  }

  /**
   * Process manual assignments into shift assignments
   * 
   * @param assignments - Manual assignments to process
   * @param staffMap - Map of staff ID to staff member (with shift info)
   * @param targetDate - The date being processed (YYYY-MM-DD format)
   * @param contractedHoursMap - Pre-fetched contracted hours
   * @param manuallyAssignedStaffIds - Set to track which staff have been manually assigned
   * @param isFromPreviousDay - Whether these assignments are from the previous day
   * @returns Array of shift assignments
   */
  async processManualAssignments(
    assignments: ManualAssignment[],
    staffMap: Map<number, StaffMemberWithShift>,
    targetDate: string,
    contractedHoursMap: Map<number, StaffContractedHours[]>,
    manuallyAssignedStaffIds: Set<number>,
    isFromPreviousDay: boolean = false
  ): Promise<ShiftAssignment[]> {
    const shiftAssignments: ShiftAssignment[] = [];

    for (const assignment of assignments) {
      const staff = staffMap.get(assignment.staffId);
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

      // If from previous day, only include night shifts
      if (isFromPreviousDay && assignment.shiftType !== 'night') {
        continue;
      }

      manuallyAssignedStaffIds.add(staff.id);

      const times = await this.shiftTimeService.getShiftTimesForStaff(
        staff,
        assignment.shiftType,
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

        shiftAssignments.push({
          staff,
          shiftType: assignment.shiftType,
          shiftStart: formatLocalTime(times.start),
          shiftEnd: formatLocalTime(times.end),
          status,
          isManualAssignment: true,
          isFixedSchedule: false,
          assignmentDate: targetDate,
        });
      }
    }

    return shiftAssignments;
  }

  /**
   * Check if a staff member has a manual assignment for a specific date
   * 
   * @param staffId - Staff member ID
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @param manualAssignmentsMap - Optional pre-fetched map of manual assignments
   * @returns The manual assignment if found, null otherwise
   */
  async getManualAssignmentForStaff(
    staffId: number,
    targetDate: string,
    manualAssignmentsMap?: Map<number, ManualAssignment[]>
  ): Promise<ManualAssignment | null> {
    let assignments: ManualAssignment[];

    if (manualAssignmentsMap) {
      assignments = manualAssignmentsMap.get(staffId) || [];
    } else {
      assignments = await this.overrideRepo.findByStaffAndDate(staffId, targetDate);
    }

    return assignments.length > 0 ? assignments[0] : null;
  }

  /**
   * Check if a manual assignment is a temporary area assignment
   * 
   * @param assignment - Manual assignment to check
   * @returns True if this is a temporary area assignment
   */
  isTemporaryAreaAssignment(assignment: ManualAssignment): boolean {
    return !!(assignment.areaType && assignment.areaId);
  }

  /**
   * Check if a manual assignment is a shift pool assignment
   * 
   * @param assignment - Manual assignment to check
   * @returns True if this is a shift pool assignment
   */
  isShiftPoolAssignment(assignment: ManualAssignment): boolean {
    return !this.isTemporaryAreaAssignment(assignment);
  }
}

