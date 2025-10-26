export const SHIFT_TIMES = {
  DAY: {
    START: '08:00:00',
    END: '20:00:00',
  },
  NIGHT: {
    START: '20:00:00',
    END: '08:00:00', // Next day
  },
} as const;

export const CYCLE_PATTERNS = {
  REGULAR: '4-on-4-off',
  SUPERVISOR: 'supervisor',
} as const;

export const CYCLE_LENGTHS = {
  REGULAR: 8, // 4 on + 4 off
  SUPERVISOR: 16, // 4 days + 4 off + 4 nights + 4 off
} as const;

export const TIME_ZONE = 'Europe/London';

