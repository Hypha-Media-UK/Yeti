import { format, parseISO, addDays, startOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

const TIME_ZONE = 'Europe/London';

export function useTimeZone() {
  /**
   * Parse a date string to a Date object in local timezone
   */
  function parseLocalDate(dateString: string): Date {
    const date = parseISO(dateString);
    return utcToZonedTime(date, TIME_ZONE);
  }

  /**
   * Format a date as YYYY-MM-DD in local timezone
   */
  function formatLocalDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const zonedDate = utcToZonedTime(dateObj, TIME_ZONE);
    return format(zonedDate, 'yyyy-MM-dd');
  }

  /**
   * Format a date for display (e.g., "Monday, 1 January 2024")
   */
  function formatDisplayDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const zonedDate = utcToZonedTime(dateObj, TIME_ZONE);
    return format(zonedDate, 'EEEE, d MMMM yyyy');
  }

  /**
   * Format a date for short display (e.g., "Mon 1 Jan")
   */
  function formatShortDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const zonedDate = utcToZonedTime(dateObj, TIME_ZONE);
    return format(zonedDate, 'EEE d MMM');
  }

  /**
   * Format time as HH:mm
   */
  function formatTime(time: string): string {
    return time.substring(0, 5);
  }

  /**
   * Get today's date as YYYY-MM-DD in local timezone
   */
  function getTodayString(): string {
    const now = new Date();
    const zonedNow = utcToZonedTime(now, TIME_ZONE);
    return format(zonedNow, 'yyyy-MM-dd');
  }

  /**
   * Add days to a date string
   */
  function addDaysToDate(dateString: string, days: number): string {
    const date = parseISO(dateString);
    const zonedDate = utcToZonedTime(date, TIME_ZONE);
    const newDate = addDays(zonedDate, days);
    return format(newDate, 'yyyy-MM-dd');
  }

  /**
   * Get the day of week (1=Monday, 7=Sunday)
   */
  function getDayOfWeek(dateString: string): number {
    const date = parseISO(dateString);
    const zonedDate = utcToZonedTime(date, TIME_ZONE);
    const day = zonedDate.getDay();
    return day === 0 ? 7 : day;
  }

  /**
   * Get the start of the week (Monday) for a given date
   */
  function getStartOfWeek(dateString: string): string {
    const dayOfWeek = getDayOfWeek(dateString);
    const daysToSubtract = dayOfWeek - 1;
    return addDaysToDate(dateString, -daysToSubtract);
  }

  /**
   * Check if a date is today
   */
  function isToday(dateString: string): boolean {
    return dateString === getTodayString();
  }

  return {
    parseLocalDate,
    formatLocalDate,
    formatDisplayDate,
    formatShortDate,
    formatTime,
    getTodayString,
    addDaysToDate,
    getDayOfWeek,
    getStartOfWeek,
    isToday,
  };
}

