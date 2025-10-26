import { daysBetween, formatLocalDate, addDaysLocal, getLocalDayOfWeek } from '../date.utils';

describe('Date Utils', () => {
  describe('daysBetween', () => {
    it('should calculate days between two dates', () => {
      const days = daysBetween('2024-01-01', '2024-01-05');
      expect(days).toBe(4);
    });

    it('should handle negative differences', () => {
      const days = daysBetween('2024-01-05', '2024-01-01');
      expect(days).toBe(-4);
    });

    it('should return 0 for same date', () => {
      const days = daysBetween('2024-01-01', '2024-01-01');
      expect(days).toBe(0);
    });

    it('should handle dates across months', () => {
      const days = daysBetween('2024-01-31', '2024-02-01');
      expect(days).toBe(1);
    });

    it('should handle dates across years', () => {
      const days = daysBetween('2023-12-31', '2024-01-01');
      expect(days).toBe(1);
    });

    it('should handle leap year correctly', () => {
      const days = daysBetween('2024-02-28', '2024-03-01');
      expect(days).toBe(2); // 2024 is a leap year
    });
  });

  describe('formatLocalDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const formatted = formatLocalDate('2024-01-05');
      expect(formatted).toBe('2024-01-05');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-05T12:00:00Z');
      const formatted = formatLocalDate(date);
      expect(formatted).toMatch(/2024-01-05/);
    });
  });

  describe('addDaysLocal', () => {
    it('should add positive days', () => {
      const newDate = addDaysLocal('2024-01-01', 5);
      const formatted = formatLocalDate(newDate);
      expect(formatted).toBe('2024-01-06');
    });

    it('should add negative days', () => {
      const newDate = addDaysLocal('2024-01-05', -3);
      const formatted = formatLocalDate(newDate);
      expect(formatted).toBe('2024-01-02');
    });

    it('should handle month boundaries', () => {
      const newDate = addDaysLocal('2024-01-31', 1);
      const formatted = formatLocalDate(newDate);
      expect(formatted).toBe('2024-02-01');
    });

    it('should handle year boundaries', () => {
      const newDate = addDaysLocal('2023-12-31', 1);
      const formatted = formatLocalDate(newDate);
      expect(formatted).toBe('2024-01-01');
    });
  });

  describe('getLocalDayOfWeek', () => {
    it('should return 1 for Monday', () => {
      const day = getLocalDayOfWeek('2024-01-01'); // Monday
      expect(day).toBe(1);
    });

    it('should return 7 for Sunday', () => {
      const day = getLocalDayOfWeek('2024-01-07'); // Sunday
      expect(day).toBe(7);
    });

    it('should return correct day for mid-week', () => {
      const day = getLocalDayOfWeek('2024-01-03'); // Wednesday
      expect(day).toBe(3);
    });
  });

  describe('DST Handling', () => {
    it('should handle spring DST transition (clocks forward)', () => {
      // In Europe/London, DST typically starts last Sunday of March
      // 2024-03-31 is the DST transition day
      const beforeDST = '2024-03-30';
      const afterDST = '2024-03-31';
      
      const days = daysBetween(beforeDST, afterDST);
      expect(days).toBe(1); // Should still be 1 day despite time change
    });

    it('should handle autumn DST transition (clocks back)', () => {
      // In Europe/London, DST typically ends last Sunday of October
      // 2024-10-27 is the DST transition day
      const beforeDST = '2024-10-26';
      const afterDST = '2024-10-27';
      
      const days = daysBetween(beforeDST, afterDST);
      expect(days).toBe(1); // Should still be 1 day despite time change
    });
  });
});

