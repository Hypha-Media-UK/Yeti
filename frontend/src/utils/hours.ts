/**
 * Utility functions for working with operational and contracted hours
 */

export interface HoursEntry {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * Removes duplicate hours entries based on dayOfWeek, startTime, and endTime
 * @param hours - Array of hours entries to deduplicate
 * @returns Array with duplicates removed
 */
export function deduplicateHours<T extends HoursEntry>(hours: T[]): T[] {
  return hours.filter((hour, index, self) =>
    index === self.findIndex(h =>
      h.dayOfWeek === hour.dayOfWeek &&
      h.startTime === hour.startTime &&
      h.endTime === hour.endTime
    )
  );
}

/**
 * Converts time from "HH:mm:ss" format to "HH:mm" format
 * @param time - Time string in "HH:mm:ss" format
 * @returns Time string in "HH:mm" format
 */
export function convertTimeFormat(time: string): string {
  return time.substring(0, 5);
}

/**
 * Day names for display
 */
export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Get day name from day number (1-7)
 * @param dayOfWeek - Day number (1=Monday, 7=Sunday)
 * @returns Day name
 */
export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek - 1] || 'Unknown';
}

