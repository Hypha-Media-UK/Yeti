/**
 * Minimum staffing requirement for an area (department or service)
 */
export interface StaffingRequirement {
  id: number;
  areaType: 'department' | 'service';
  areaId: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  timeStart: string; // HH:MM:SS format
  timeEnd: string; // HH:MM:SS format
  requiredStaff: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new staffing requirement
 */
export interface CreateStaffingRequirementDto {
  areaType: 'department' | 'service';
  areaId: number;
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  requiredStaff: number;
}

/**
 * DTO for updating a staffing requirement
 */
export interface UpdateStaffingRequirementDto {
  dayOfWeek?: number;
  timeStart?: string;
  timeEnd?: string;
  requiredStaff?: number;
}

/**
 * Grouped staffing requirements by day for easier UI display
 */
export interface StaffingRequirementsByDay {
  dayOfWeek: number;
  requirements: StaffingRequirement[];
}

/**
 * Time range with required staff count (for UI)
 */
export interface TimeRangeRequirement {
  timeStart: string;
  timeEnd: string;
  requiredStaff: number;
}

/**
 * Staffing requirement configuration for a specific day (for UI)
 */
export interface DayStaffingConfig {
  dayOfWeek: number;
  timeRanges: TimeRangeRequirement[];
}

