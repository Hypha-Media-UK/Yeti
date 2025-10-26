import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { differenceInDays, parseISO, addDays, startOfDay } from 'date-fns';
import { TIME_ZONE } from '../config/constants';

/**
 * Convert a date string to a Date object in the local timezone
 */
export function parseLocalDate(dateString: string): Date {
  const date = parseISO(dateString);
  return utcToZonedTime(date, TIME_ZONE);
}

/**
 * Get the start of day in local timezone
 */
export function getLocalStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = utcToZonedTime(dateObj, TIME_ZONE);
  return startOfDay(zonedDate);
}

/**
 * Calculate the number of days between two dates in local timezone
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  const local1 = getLocalStartOfDay(d1);
  const local2 = getLocalStartOfDay(d2);
  
  return differenceInDays(local2, local1);
}

/**
 * Add days to a date in local timezone
 */
export function addDaysLocal(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = utcToZonedTime(dateObj, TIME_ZONE);
  return addDays(zonedDate, days);
}

/**
 * Format a date as YYYY-MM-DD in local timezone
 */
export function formatLocalDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = utcToZonedTime(dateObj, TIME_ZONE);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: TIME_ZONE });
}

/**
 * Format a time as HH:mm in local timezone
 */
export function formatLocalTime(time: string): string {
  return time.substring(0, 5); // Extract HH:mm from HH:mm:ss
}

/**
 * Check if a date is valid
 */
export function isValidDate(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Get the day of week (1=Monday, 7=Sunday) for a date in local timezone
 */
export function getLocalDayOfWeek(date: Date | string): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = utcToZonedTime(dateObj, TIME_ZONE);
  const day = zonedDate.getDay();
  return day === 0 ? 7 : day; // Convert Sunday from 0 to 7
}

/**
 * Combine a date and time string into a full datetime in local timezone
 */
export function combineDateAndTime(dateString: string, timeString: string): Date {
  const [hours, minutes, seconds = '00'] = timeString.split(':');
  const dateTimeString = `${dateString}T${hours}:${minutes}:${seconds}`;
  return zonedTimeToUtc(dateTimeString, TIME_ZONE);
}

/**
 * Check if a datetime falls within a date (considering timezone)
 */
export function isDateTimeOnDate(datetime: Date, targetDate: string): boolean {
  const zonedDateTime = utcToZonedTime(datetime, TIME_ZONE);
  const dateString = format(zonedDateTime, 'yyyy-MM-dd', { timeZone: TIME_ZONE });
  return dateString === targetDate;
}

