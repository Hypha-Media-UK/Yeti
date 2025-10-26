import { isValidDate } from './date.utils';

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

export function validateShiftGroup(group: string | null): { valid: boolean; error?: string } {
  if (group === null) {
    return { valid: true };
  }
  
  const validGroups = ['Day', 'Night'];
  if (!validGroups.includes(group)) {
    return { valid: false, error: `Invalid group. Must be one of: ${validGroups.join(', ')} or null` };
  }
  return { valid: true };
}

