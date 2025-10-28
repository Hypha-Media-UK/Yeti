import { parseISO, differenceInHours, format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import type { Absence } from '../../../shared/types/absence';

const TIME_ZONE = 'Europe/London';

export function useAbsence() {
  /**
   * Check if an absence is currently active (based on current time)
   */
  function isAbsenceActive(absence: Absence | null | undefined): boolean {
    if (!absence) return false;

    const now = new Date();
    const start = parseISO(absence.startDatetime);
    const end = parseISO(absence.endDatetime);

    return now >= start && now <= end;
  }

  /**
   * Format absence period for display
   * - Short absences (< 24 hours): Show time range (e.g., "08:05 - 08:20")
   * - Multi-day absences: Show date range (e.g., "28/10 - 05/11")
   */
  function formatAbsencePeriod(absence: Absence): string {
    const start = parseISO(absence.startDatetime);
    const end = parseISO(absence.endDatetime);
    const zonedStart = utcToZonedTime(start, TIME_ZONE);
    const zonedEnd = utcToZonedTime(end, TIME_ZONE);

    const durationHours = differenceInHours(end, start);

    if (durationHours < 24) {
      // Short absence - show time range
      const startTime = format(zonedStart, 'HH:mm');
      const endTime = format(zonedEnd, 'HH:mm');
      return `${startTime} - ${endTime}`;
    } else {
      // Multi-day absence - show date range
      const startDate = format(zonedStart, 'dd/MM');
      const endDate = format(zonedEnd, 'dd/MM');
      return `${startDate} - ${endDate}`;
    }
  }

  /**
   * Format absence type for display
   */
  function formatAbsenceType(type: string): string {
    const types: Record<string, string> = {
      'sickness': 'Sick',
      'annual_leave': 'Leave',
      'training': 'Training',
      'absence': 'Absent',
    };
    return types[type] || type;
  }

  /**
   * Get full absence display text (type + period)
   */
  function formatAbsenceDisplay(absence: Absence): string {
    const type = formatAbsenceType(absence.absenceType);
    const period = formatAbsencePeriod(absence);
    return `${type}: ${period}`;
  }

  return {
    isAbsenceActive,
    formatAbsencePeriod,
    formatAbsenceType,
    formatAbsenceDisplay,
  };
}

