import { StaffMemberWithShift } from '../../../shared/types/staff';
import { ShiftAssignment, ShiftStatus, ManualAssignment } from '../../../shared/types/shift';
import { StaffContractedHours } from '../../../shared/types/operational-hours';
import { OverrideRepository } from '../../repositories/override.repository';
import { ShiftTimeService } from './shift-time.service';
import { formatLocalTime } from '../../utils/date.utils';

/**
 * ManualAssignmentService
 *
 * Responsible for processing manual assignments:
 * - Manual assignments override cycle-based schedules
 * - Handles both shift pool assignments and temporary area assignments
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
   *
   * @param targetDate - The date to get assignments for (YYYY-MM-DD format)
   * @returns Array of manual assignments for the target date
   */
  async getManualAssignmentsForDate(targetDate: string): Promise<ManualAssignment[]> {
    return await this.overrideRepo.findByDate(targetDate);
  }

  /**
   * Process manual assignments into shift assignments
   *
   * @param assignments - Manual assignments to process
   * @param staffMap - Map of staff ID to staff member (with shift info)
   * @param targetDate - The date being processed (YYYY-MM-DD format)
   * @param contractedHoursMap - Pre-fetched contracted hours
   * @param manuallyAssignedStaffIds - Set to track which staff have been manually assigned
   * @param appZeroDate - The app's zero date reference point
   * @returns Array of shift assignments
   */
  async processManualAssignments(
    assignments: ManualAssignment[],
    staffMap: Map<number, StaffMemberWithShift>,
    targetDate: string,
    contractedHoursMap: Map<number, StaffContractedHours[]>,
    manuallyAssignedStaffIds: Set<number>,
    appZeroDate: string
  ): Promise<ShiftAssignment[]> {
    const shiftAssignments: ShiftAssignment[] = [];

    for (const assignment of assignments) {
      const staff = staffMap.get(assignment.staffId);
      if (!staff) continue;

      // Track whether this is a temporary area assignment
      const hasAreaAllocation = !!(assignment.areaType && assignment.areaId);

      manuallyAssignedStaffIds.add(staff.id);

      let times: { start: string; end: string } | null = null;

      // Priority 1: Use allocation times if this is a temporary area assignment with custom times
      if (hasAreaAllocation && assignment.startTime && assignment.endTime) {
        times = {
          start: assignment.startTime,
          end: assignment.endTime
        };
      } else {
        // Priority 2: Get shift times for staff (contracted hours or custom shift times)
        times = await this.shiftTimeService.getShiftTimesForStaff(
          staff,
          assignment.shiftType,
          targetDate,
          { contractedHoursMap, appZeroDate }
        );

        // Priority 3: If getShiftTimesForStaff returns null (e.g., staff has contracted hours but not for this day),
        // fall back to default shift times for manual assignments
        if (!times) {
          times = this.shiftTimeService.getDefaultShiftTimes(assignment.shiftType);
        }
      }

      if (times) {
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

        const shiftAssignment: ShiftAssignment = {
          staff,
          shiftType: assignment.shiftType,
          shiftStart: formatLocalTime(times.start),
          shiftEnd: formatLocalTime(times.end),
          status,
          isManualAssignment: true,
          isFixedSchedule: false,
          assignmentDate: targetDate,
        };

        // Mark if this is a temporary area allocation
        if (hasAreaAllocation) {
          shiftAssignment.hasAreaAllocation = true;
        }

        shiftAssignments.push(shiftAssignment);
      }
    }

    return shiftAssignments;
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

