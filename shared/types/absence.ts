export type AbsenceType = 'sickness' | 'annual_leave' | 'training' | 'absence';

export interface Absence {
  id: number;
  staffId: number;
  absenceType: AbsenceType;
  startDatetime: string; // ISO 8601 datetime string
  endDatetime: string;   // ISO 8601 datetime string
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAbsenceRequest {
  staffId: number;
  absenceType: AbsenceType;
  startDatetime: string;
  endDatetime: string;
  notes?: string;
}

export interface UpdateAbsenceRequest {
  absenceType?: AbsenceType;
  startDatetime?: string;
  endDatetime?: string;
  notes?: string;
}

