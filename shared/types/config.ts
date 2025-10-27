export interface AppConfig {
  appZeroDate: string;
  timeZone: string;
}

export interface ShiftTimesConfig {
  dayShiftStart: string;
  dayShiftEnd: string;
  nightShiftStart: string;
  nightShiftEnd: string;
}

export interface ConfigRecord {
  id: number;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

