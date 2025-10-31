import { describe, it, expect } from 'vitest';
import { daysBetween } from '../date.utils';
import { calculateCyclePosition } from '../cycle.utils';

/**
 * Verification tests for app_zero_date migration from 2024-01-01 to 2025-10-26
 * 
 * This test suite verifies that:
 * 1. The 664-day difference is correctly calculated
 * 2. 4-on-4-off cycles remain perfectly aligned (664 % 8 = 0)
 * 3. 16-day-supervisor cycles are compensated with +8 offset adjustment
 */
describe('Zero Date Migration Verification', () => {
  const OLD_ZERO_DATE = '2024-01-01';
  const NEW_ZERO_DATE = '2025-10-26';
  
  it('should calculate correct days difference between old and new zero dates', () => {
    const daysDiff = daysBetween(OLD_ZERO_DATE, NEW_ZERO_DATE);
    expect(daysDiff).toBe(664);
  });

  describe('4-on-4-off Cycle (8-day cycle)', () => {
    it('should remain perfectly aligned (664 % 8 = 0)', () => {
      const daysDiff = daysBetween(OLD_ZERO_DATE, NEW_ZERO_DATE);
      const remainder = daysDiff % 8;
      expect(remainder).toBe(0);
    });

    it('should produce same cycle position for any test date with offset 0', () => {
      const testDate = '2025-11-15'; // Random future date
      
      // Old calculation (from 2024-01-01, offset 0)
      const oldDaysSinceZero = daysBetween(OLD_ZERO_DATE, testDate);
      const oldPosition = calculateCyclePosition(oldDaysSinceZero, 0, 8);
      
      // New calculation (from 2025-10-26, offset 0)
      const newDaysSinceZero = daysBetween(NEW_ZERO_DATE, testDate);
      const newPosition = calculateCyclePosition(newDaysSinceZero, 0, 8);
      
      expect(newPosition).toBe(oldPosition);
    });

    it('should produce same cycle position for any test date with offset 4', () => {
      const testDate = '2025-11-15'; // Random future date
      
      // Old calculation (from 2024-01-01, offset 4)
      const oldDaysSinceZero = daysBetween(OLD_ZERO_DATE, testDate);
      const oldPosition = calculateCyclePosition(oldDaysSinceZero, 4, 8);
      
      // New calculation (from 2025-10-26, offset 4)
      const newDaysSinceZero = daysBetween(NEW_ZERO_DATE, testDate);
      const newPosition = calculateCyclePosition(newDaysSinceZero, 4, 8);
      
      expect(newPosition).toBe(oldPosition);
    });

    it('should verify multiple test dates across different months', () => {
      const testDates = [
        '2025-11-01',
        '2025-12-15',
        '2026-01-20',
        '2026-06-30',
      ];

      testDates.forEach(testDate => {
        const oldDaysSinceZero = daysBetween(OLD_ZERO_DATE, testDate);
        const oldPosition = calculateCyclePosition(oldDaysSinceZero, 0, 8);
        
        const newDaysSinceZero = daysBetween(NEW_ZERO_DATE, testDate);
        const newPosition = calculateCyclePosition(newDaysSinceZero, 0, 8);
        
        expect(newPosition).toBe(oldPosition);
      });
    });
  });

  describe('16-day Supervisor Cycle', () => {
    it('should have 8-position shift without offset adjustment (664 % 16 = 8)', () => {
      const daysDiff = daysBetween(OLD_ZERO_DATE, NEW_ZERO_DATE);
      const remainder = daysDiff % 16;
      expect(remainder).toBe(8);
    });

    it('should produce same cycle position with +8 offset compensation', () => {
      const testDate = '2025-11-15'; // Random future date
      
      // Old calculation (from 2024-01-01, offset 0)
      const oldDaysSinceZero = daysBetween(OLD_ZERO_DATE, testDate);
      const oldPosition = calculateCyclePosition(oldDaysSinceZero, 0, 16);
      
      // New calculation (from 2025-10-26, offset 8 to compensate)
      const newDaysSinceZero = daysBetween(NEW_ZERO_DATE, testDate);
      const newPosition = calculateCyclePosition(newDaysSinceZero, 8, 16);
      
      expect(newPosition).toBe(oldPosition);
    });

    it('should verify supervisor schedule remains unchanged across multiple dates', () => {
      const testDates = [
        '2025-11-01',
        '2025-12-15',
        '2026-01-20',
        '2026-06-30',
      ];

      testDates.forEach(testDate => {
        // Old: offset 0
        const oldDaysSinceZero = daysBetween(OLD_ZERO_DATE, testDate);
        const oldPosition = calculateCyclePosition(oldDaysSinceZero, 0, 16);
        
        // New: offset 8 (compensated)
        const newDaysSinceZero = daysBetween(NEW_ZERO_DATE, testDate);
        const newPosition = calculateCyclePosition(newDaysSinceZero, 8, 16);
        
        expect(newPosition).toBe(oldPosition);
      });
    });

    it('should verify day shift positions (0-3) remain day shifts', () => {
      // Find a date that was in day shift phase (positions 0-3) with old zero date
      const testDate = '2024-01-01'; // Position 0 with old zero date
      
      const oldDaysSinceZero = daysBetween(OLD_ZERO_DATE, testDate);
      const oldPosition = calculateCyclePosition(oldDaysSinceZero, 0, 16);
      expect(oldPosition).toBe(0); // Day shift
      
      const newDaysSinceZero = daysBetween(NEW_ZERO_DATE, testDate);
      const newPosition = calculateCyclePosition(newDaysSinceZero, 8, 16);
      expect(newPosition).toBe(0); // Still day shift with compensation
    });

    it('should verify night shift positions (8-11) remain night shifts', () => {
      // Find a date that was in night shift phase (positions 8-11) with old zero date
      const testDate = '2024-01-09'; // Position 8 with old zero date (8 days after zero)
      
      const oldDaysSinceZero = daysBetween(OLD_ZERO_DATE, testDate);
      const oldPosition = calculateCyclePosition(oldDaysSinceZero, 0, 16);
      expect(oldPosition).toBe(8); // Night shift
      
      const newDaysSinceZero = daysBetween(NEW_ZERO_DATE, testDate);
      const newPosition = calculateCyclePosition(newDaysSinceZero, 8, 16);
      expect(newPosition).toBe(8); // Still night shift with compensation
    });

    it('should verify off days (4-7, 12-15) remain off days', () => {
      // Test an off day after day shift
      const testDate1 = '2024-01-05'; // Position 4 with old zero date
      
      const oldDaysSinceZero1 = daysBetween(OLD_ZERO_DATE, testDate1);
      const oldPosition1 = calculateCyclePosition(oldDaysSinceZero1, 0, 16);
      expect(oldPosition1).toBe(4); // Off day
      
      const newDaysSinceZero1 = daysBetween(NEW_ZERO_DATE, testDate1);
      const newPosition1 = calculateCyclePosition(newDaysSinceZero1, 8, 16);
      expect(newPosition1).toBe(4); // Still off day with compensation
      
      // Test an off day after night shift
      const testDate2 = '2024-01-13'; // Position 12 with old zero date
      
      const oldDaysSinceZero2 = daysBetween(OLD_ZERO_DATE, testDate2);
      const oldPosition2 = calculateCyclePosition(oldDaysSinceZero2, 0, 16);
      expect(oldPosition2).toBe(12); // Off day
      
      const newDaysSinceZero2 = daysBetween(NEW_ZERO_DATE, testDate2);
      const newPosition2 = calculateCyclePosition(newDaysSinceZero2, 8, 16);
      expect(newPosition2).toBe(12); // Still off day with compensation
    });
  });

  describe('Real-world verification for today', () => {
    it('should verify today (2025-10-30) produces same results', () => {
      const today = '2025-10-30';
      
      // 4-on-4-off verification
      const old8DaysSince = daysBetween(OLD_ZERO_DATE, today);
      const old8Position = calculateCyclePosition(old8DaysSince, 0, 8);
      
      const new8DaysSince = daysBetween(NEW_ZERO_DATE, today);
      const new8Position = calculateCyclePosition(new8DaysSince, 0, 8);
      
      expect(new8Position).toBe(old8Position);
      
      // 16-day supervisor verification
      const old16DaysSince = daysBetween(OLD_ZERO_DATE, today);
      const old16Position = calculateCyclePosition(old16DaysSince, 0, 16);
      
      const new16DaysSince = daysBetween(NEW_ZERO_DATE, today);
      const new16Position = calculateCyclePosition(new16DaysSince, 8, 16);
      
      expect(new16Position).toBe(old16Position);
    });
  });

  describe('Migration summary', () => {
    it('should document the migration changes', () => {
      const summary = {
        oldZeroDate: OLD_ZERO_DATE,
        newZeroDate: NEW_ZERO_DATE,
        daysDifference: 664,
        regularCycleAlignment: '664 % 8 = 0 (perfect alignment)',
        supervisorCycleShift: '664 % 16 = 8 (requires +8 offset)',
        regularShiftsAffected: 'None - perfect alignment maintained',
        supervisorShiftsAffected: 'All supervisor shifts - offset increased by 8',
        supervisorShiftsUpdated: [
          { id: 23, name: 'Supervisor Shift A', oldOffset: 0, newOffset: 8 },
          { id: 14, name: 'Supervisor Shift B', oldOffset: 0, newOffset: 8 },
        ],
      };
      
      expect(summary.daysDifference).toBe(664);
      expect(summary.supervisorShiftsUpdated).toHaveLength(2);
    });
  });
});

