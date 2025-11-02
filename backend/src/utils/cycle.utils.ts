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
 * NOTE: This function is only used for Regular staff shifts (4-on-4-off).
 * Supervisors are no longer tied to shifts - they use supervisor_offset directly.
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

  // Supervisor shifts should not exist anymore - supervisors use supervisor_offset
  // If we encounter one, log a warning but don't crash
  if (cycleType === '16-day-supervisor') {
    console.warn('Encountered supervisor shift in isShiftActiveOnDate - supervisors should use supervisor_offset instead');
    return false;
  }

  const { onDuty } = calculateCycleStatus(cycleType, daysSinceZero, daysOffset);
  return onDuty;
}



