/**
 * Time validation utilities for handling time ranges including overnight shifts
 */

/**
 * Validates that a time string is in HH:mm or HH:mm:ss format
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(time);
}

/**
 * Convert time string (HH:mm or HH:mm:ss) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Check if a time range is valid
 * Allows overnight shifts (e.g., 22:00 to 06:00)
 * 
 * @param startTime - Start time in HH:mm or HH:mm:ss format
 * @param endTime - End time in HH:mm or HH:mm:ss format
 * @returns Object with validation result and optional error message
 */
export function validateTimeRange(
  startTime: string,
  endTime: string
): { valid: boolean; error?: string; isOvernight?: boolean } {
  // Validate format
  if (!isValidTimeFormat(startTime)) {
    return { valid: false, error: 'Start time must be in HH:mm format' };
  }
  if (!isValidTimeFormat(endTime)) {
    return { valid: false, error: 'End time must be in HH:mm format' };
  }

  // Check for same start and end time
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  if (startMinutes === endMinutes) {
    return { valid: false, error: 'Start time and end time cannot be the same' };
  }

  // Determine if this is an overnight shift
  const isOvernight = endMinutes < startMinutes;

  return { valid: true, isOvernight };
}

/**
 * Calculate the duration of a time range in minutes
 * Handles overnight shifts correctly
 * 
 * @param startTime - Start time in HH:mm or HH:mm:ss format
 * @param endTime - End time in HH:mm or HH:mm:ss format
 * @returns Duration in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes >= startMinutes) {
    // Same-day shift
    return endMinutes - startMinutes;
  } else {
    // Overnight shift
    return (24 * 60 - startMinutes) + endMinutes;
  }
}

/**
 * Format duration in minutes to a human-readable string
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted string like "8h 30m" or "12h"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Check if a specific time falls within a time range
 * Handles overnight shifts correctly
 * 
 * @param time - Time to check in HH:mm or HH:mm:ss format
 * @param startTime - Range start time in HH:mm or HH:mm:ss format
 * @param endTime - Range end time in HH:mm or HH:mm:ss format
 * @returns True if time is within the range
 */
export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes >= startMinutes) {
    // Same-day range
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  } else {
    // Overnight range
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
  }
}

