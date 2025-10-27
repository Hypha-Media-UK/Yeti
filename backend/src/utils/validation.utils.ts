import { isValidDate } from './date.utils';
import { AreaType } from '../../shared/types/allocation';

export function validateDateString(date: string): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }

  if (!isValidDate(date)) {
    return { valid: false, error: 'Invalid date format. Expected YYYY-MM-DD' };
  }

  return { valid: true };
}

export function validateTimeString(time: string): { valid: boolean; error?: string } {
  if (!time) {
    return { valid: false, error: 'Time is required' };
  }

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(time)) {
    return { valid: false, error: 'Invalid time format. Expected HH:mm or HH:mm:ss' };
  }

  return { valid: true };
}

export function validateStaffStatus(status: string): { valid: boolean; error?: string } {
  const validStatuses = ['Regular', 'Relief', 'Supervisor'];
  if (!validStatuses.includes(status)) {
    return { valid: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
  }
  return { valid: true };
}

export function validateShiftType(shiftType: string): { valid: boolean; error?: string } {
  const validTypes = ['day', 'night'];
  if (!validTypes.includes(shiftType)) {
    return { valid: false, error: `Invalid shift type. Must be one of: ${validTypes.join(', ')}` };
  }
  return { valid: true };
}

/**
 * Validates that a string is a valid AreaType ('department' or 'service')
 * @param areaType - The area type to validate
 * @returns True if valid, false otherwise
 */
export function validateAreaType(areaType: string): areaType is AreaType {
  return areaType === 'department' || areaType === 'service';
}

/**
 * Validates that a value is a positive integer
 * @param value - The value to validate
 * @returns True if valid positive integer, false otherwise
 */
export function isPositiveInteger(value: any): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Validates that a string is not empty after trimming
 * @param value - The string to validate
 * @returns True if non-empty, false otherwise
 */
export function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates that an ID parameter is a valid positive integer
 * @param id - The ID to validate (can be string or number)
 * @returns The parsed ID if valid, null otherwise
 */
export function parseId(id: string | number): number | null {
  const parsed = typeof id === 'string' ? parseInt(id, 10) : id;
  return isPositiveInteger(parsed) ? parsed : null;
}

