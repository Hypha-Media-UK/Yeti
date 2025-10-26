import { AreaType } from './allocation';

// Operational hours for departments and services
export interface AreaOperationalHours {
  id: number;
  areaType: AreaType;
  areaId: number;
  dayOfWeek: number; // 1=Monday, 2=Tuesday, ..., 7=Sunday (ISO 8601)
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format (can be <= startTime for midnight crossing)
  createdAt: string;
  updatedAt: string;
}

// Re-export AreaType for convenience
export type { AreaType };

// Contracted hours for staff members
export interface StaffContractedHours {
  id: number;
  staffId: number;
  dayOfWeek: number; // 1=Monday, 2=Tuesday, ..., 7=Sunday (ISO 8601)
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format (can be <= startTime for midnight crossing)
  createdAt: string;
  updatedAt: string;
}

// Day names in order (Monday = 1, Sunday = 7)
export const DAY_NAMES = [
  'Monday',    // 1
  'Tuesday',   // 2
  'Wednesday', // 3
  'Thursday',  // 4
  'Friday',    // 5
  'Saturday',  // 6
  'Sunday',    // 7
] as const;

// Helper to get day name from day number
export function getDayName(dayOfWeek: number): string {
  if (dayOfWeek < 1 || dayOfWeek > 7) {
    throw new Error(`Invalid day of week: ${dayOfWeek}. Must be 1-7.`);
  }
  return DAY_NAMES[dayOfWeek - 1];
}

// Helper to validate time format (HH:mm)
export function isValidTimeFormat(time: string): boolean {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

// Helper to check if a shift crosses midnight
export function crossesMidnight(startTime: string, endTime: string): boolean {
  return startTime >= endTime;
}

// Helper to validate operational hours entry
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateOperationalHours(
  dayOfWeek: number,
  startTime: string,
  endTime: string
): ValidationResult {
  // Validate day of week
  if (dayOfWeek < 1 || dayOfWeek > 7) {
    return { valid: false, error: 'Day of week must be between 1 (Monday) and 7 (Sunday)' };
  }

  // Validate time format
  if (!isValidTimeFormat(startTime)) {
    return { valid: false, error: 'Start time must be in HH:mm format' };
  }
  if (!isValidTimeFormat(endTime)) {
    return { valid: false, error: 'End time must be in HH:mm format' };
  }

  // Check for same start and end time
  if (startTime === endTime) {
    return { valid: false, error: 'Start time and end time cannot be the same' };
  }

  return { valid: true };
}

// Helper to check for overlapping time ranges on the same day
// Note: This is complex with midnight-crossing shifts, so we keep it simple
export function hasOverlap(
  existing: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  newEntry: { dayOfWeek: number; startTime: string; endTime: string }
): boolean {
  const sameDayEntries = existing.filter(e => e.dayOfWeek === newEntry.dayOfWeek);
  
  for (const entry of sameDayEntries) {
    // For simplicity, we'll just check for exact duplicates
    // More complex overlap detection can be added later if needed
    if (entry.startTime === newEntry.startTime && entry.endTime === newEntry.endTime) {
      return true;
    }
  }
  
  return false;
}

