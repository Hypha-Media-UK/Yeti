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
    
    if (cyclePosition < 4) {
      // Days 0-3: Day shift
      return { onDuty: true, shiftType: 'day' };
    } else if (cyclePosition >= 8 && cyclePosition < 12) {
      // Days 8-11: Night shift
      return { onDuty: true, shiftType: 'night' };
    } else {
      // Days 4-7 and 12-15: Off duty
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

  const { onDuty } = calculateCycleStatus(cycleType, daysSinceZero, daysOffset);
  return onDuty;
}

