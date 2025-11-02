/**
 * Cycle calculation utilities for shift scheduling
 * 
 * This module contains pure functions for calculating staff duty cycles.
 * All functions are deterministic and have no side effects.
 */

import { CycleType } from '../../shared/types/shift';

export const CYCLE_LENGTHS = {
  REGULAR: 8,      // 4 on, 4 off
  SUPERVISOR: 16,  // 4 day, 4 off, 4 night, 4 off
} as const;

/**
 * Calculate if a staff member is on duty based on their cycle type
 * 
 * @param cycleType - The type of cycle (4-on-4-off or 16-day-supervisor)
 * @param daysSinceZero - Number of days since app zero date
 * @param daysOffset - Personal or shift offset from zero date
 * @returns Object with onDuty status and shift type (day/night/null)
 * 
 * @example
 * // Regular staff on day 0 with no offset
 * calculateCycleStatus('4-on-4-off', 0, 0)
 * // Returns: { onDuty: true, shiftType: 'day' }
 * 
 * @example
 * // Supervisor on day 8 (night shift portion of cycle)
 * calculateCycleStatus('16-day-supervisor', 8, 0)
 * // Returns: { onDuty: true, shiftType: 'night' }
 */
export function calculateCycleStatus(
  cycleType: CycleType,
  daysSinceZero: number,
  daysOffset: number
): { onDuty: boolean; shiftType: 'day' | 'night' | null } {
  const adjustedDays = daysSinceZero - daysOffset;

  if (cycleType === '4-on-4-off') {
    const cyclePosition = ((adjustedDays % CYCLE_LENGTHS.REGULAR) + CYCLE_LENGTHS.REGULAR) % CYCLE_LENGTHS.REGULAR;
    return {
      onDuty: cyclePosition < 4,
      shiftType: cyclePosition < 4 ? 'day' : null,
    };
  }

  if (cycleType === '16-day-supervisor') {
    const cyclePosition = ((adjustedDays % CYCLE_LENGTHS.SUPERVISOR) + CYCLE_LENGTHS.SUPERVISOR) % CYCLE_LENGTHS.SUPERVISOR;

    // Supervisors work 4 consecutive days, twice in the 16-day cycle
    // ALL supervisors work at the same cycle positions:
    // - Positions 7-10: DAY shift
    // - Positions 15, 0, 1, 2: NIGHT shift (wraps around)
    // - All other positions: OFF duty
    //
    // The offset determines WHEN each supervisor hits position 7
    // Example with app zero date 2025-10-26:
    // - Offset 0: Hits position 7 on Nov 2 (day 7)
    // - Offset 4: Hits position 7 on Nov 6 (day 11)
    // - Offset 8: Hits position 7 on Nov 10 (day 15)
    // - Offset 12: Hits position 7 on Nov 14 (day 19)

    if (cyclePosition >= 7 && cyclePosition <= 10) {
      // Positions 7-10: Day shift
      return { onDuty: true, shiftType: 'day' };
    } else if (cyclePosition === 15 || cyclePosition <= 2) {
      // Positions 15, 0, 1, 2: Night shift (wraps around)
      return { onDuty: true, shiftType: 'night' };
    } else {
      // Positions 3-6 and 11-14: Off duty
      return { onDuty: false, shiftType: null };
    }
  }

  // Relief or fixed schedules don't use cycle logic
  return { onDuty: false, shiftType: null };
}

/**
 * Calculate the position within a cycle for a given date
 * 
 * @param daysSinceZero - Number of days since app zero date
 * @param daysOffset - Personal or shift offset from zero date
 * @param cycleLength - Length of the cycle (8 for regular, 16 for supervisor)
 * @returns Position in the cycle (0-based, 0 to cycleLength-1)
 * 
 * @example
 * // Day 10 with offset 2 in an 8-day cycle
 * calculateCyclePosition(10, 2, 8)
 * // Returns: 0 (because (10-2) % 8 = 0)
 */
export function calculateCyclePosition(
  daysSinceZero: number,
  daysOffset: number,
  cycleLength: number
): number {
  const adjustedDays = daysSinceZero - daysOffset;
  return ((adjustedDays % cycleLength) + cycleLength) % cycleLength;
}

/**
 * Check if a shift is active on a given date based on its cycle
 *
 * @param cycleType - The type of cycle
 * @param cycleLength - Length of the cycle
 * @param daysSinceZero - Number of days since app zero date
 * @param daysOffset - Shift offset from zero date
 * @returns true if the shift is active on this date
 */
export function isShiftActiveOnDate(
  cycleType: CycleType | null,
  cycleLength: number | null,
  daysSinceZero: number,
  daysOffset: number
): boolean {
  // Shifts without cycle information (relief, fixed) are not calculated
  if (!cycleType || !cycleLength) {
    return false;
  }

  // For supervisor shifts, check if ANY supervisor (with any offset 0, 4, 8, 12) would be working
  // Since supervisors work at positions 7-10 (day) and 15-2 (night), and there are 4 offset groups,
  // at least one supervisor is always working on any given day
  if (cycleType === '16-day-supervisor') {
    // Check all 4 possible offset groups (0, 4, 8, 12)
    for (let offsetGroup = 0; offsetGroup < 4; offsetGroup++) {
      const testOffset = daysOffset + (offsetGroup * 4);
      const { onDuty } = calculateCycleStatus(cycleType, daysSinceZero, testOffset);
      if (onDuty) {
        return true;
      }
    }
    return false;
  }

  const { onDuty } = calculateCycleStatus(cycleType, daysSinceZero, daysOffset);
  return onDuty;
}

/**
 * Calculate which regular shift offset a supervisor should align with on a given date
 *
 * Supervisors follow a 16-day cycle but need to appear with regular staff shifts (A or B).
 * The mapping is:
 * - Cycle days 0, 8: Shift B (offset 4)
 * - Cycle days 1-3, 9-11: Shift A (offset 0)
 * - Cycle days 4, 12: Shift A (offset 0)
 * - Cycle days 5-7, 13-15: Shift B (offset 4)
 *
 * @param daysSinceZero - Number of days since app zero date
 * @param supervisorOffset - The supervisor's personal or shift offset
 * @returns The regular shift offset (0 for Shift A, 4 for Shift B) to align with
 *
 * @example
 * // Supervisor with offset 0 on day 0 of their cycle
 * getSupervisorRegularShiftOffset(0, 0) // Returns 4 (Shift B)
 *
 * @example
 * // Supervisor with offset 0 on day 1 of their cycle
 * getSupervisorRegularShiftOffset(1, 0) // Returns 0 (Shift A)
 */
export function getSupervisorRegularShiftOffset(
  daysSinceZero: number,
  supervisorOffset: number
): number {
  // Calculate the supervisor's position in their 16-day cycle
  const cyclePosition = calculateCyclePosition(daysSinceZero, supervisorOffset, CYCLE_LENGTHS.SUPERVISOR);

  // The pattern depends on BOTH the cycle position AND the supervisor's offset
  // Supervisors with different offsets work opposite shifts to ensure coverage

  // Normalize the supervisor offset to 0-15 range
  const normalizedOffset = ((supervisorOffset % 16) + 16) % 16;

  // Determine which "group" the supervisor belongs to (0-3, 4-7, 8-11, or 12-15)
  const offsetGroup = Math.floor(normalizedOffset / 4);

  // Base mapping for offset group 0 (offsets 0-3):
  const baseMapping: Record<number, number> = {
    0: 0,  // Shift A
    1: 0,  // Shift A
    2: 0,  // Shift A
    3: 0,  // Shift A
    4: 0,  // Shift A
    5: 4,  // Shift B
    6: 4,  // Shift B
    7: 4,  // Shift B
    8: 0,  // Shift A
    9: 0,  // Shift A
    10: 0, // Shift A
    11: 0, // Shift A
    12: 0, // Shift A
    13: 4, // Shift B
    14: 4, // Shift B
    15: 4, // Shift B
  };

  const baseShift = baseMapping[cyclePosition] || 0;

  // Invert the shift for offset groups 1 and 3 (offsets 4-7 and 12-15)
  if (offsetGroup === 1 || offsetGroup === 3) {
    return baseShift === 0 ? 4 : 0;
  }

  return baseShift;
}

