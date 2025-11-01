import { StaffingRequirementRepository } from '../repositories/staffing-requirement.repository';
import { StaffingRequirement } from '../../shared/types/staffing-requirement';

/**
 * Time slot for checking staffing levels
 */
interface TimeSlot {
  start: string; // HH:MM:SS
  end: string; // HH:MM:SS
  requiredStaff: number;
  actualStaff: number;
}

/**
 * Result of staffing level check for an area
 */
export interface StaffingLevelResult {
  isUnderstaffed: boolean;
  timeSlots: TimeSlot[];
  understaffedSlots: TimeSlot[];
}

export class StaffingLevelService {
  private staffingReqRepo: StaffingRequirementRepository;

  constructor() {
    this.staffingReqRepo = new StaffingRequirementRepository();
  }

  /**
   * Check if an area is understaffed at any point during a specific day
   * @param areaType - 'department' or 'service'
   * @param areaId - ID of the area
   * @param dayOfWeek - Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   * @param staffCount - Number of staff currently assigned to the area
   * @returns StaffingLevelResult indicating if area is understaffed
   */
  async checkStaffingLevel(
    areaType: 'department' | 'service',
    areaId: number,
    dayOfWeek: number,
    staffCount: number
  ): Promise<StaffingLevelResult> {
    // Get staffing requirements for this area and day
    const requirements = await this.staffingReqRepo.findByAreaAndDay(areaType, areaId, dayOfWeek);

    // If no requirements, area is not understaffed
    if (requirements.length === 0) {
      return {
        isUnderstaffed: false,
        timeSlots: [],
        understaffedSlots: [],
      };
    }

    // Check each time slot
    const timeSlots: TimeSlot[] = requirements.map(req => ({
      start: req.timeStart,
      end: req.timeEnd,
      requiredStaff: req.requiredStaff,
      actualStaff: staffCount,
    }));

    const understaffedSlots = timeSlots.filter(slot => slot.actualStaff < slot.requiredStaff);

    return {
      isUnderstaffed: understaffedSlots.length > 0,
      timeSlots,
      understaffedSlots,
    };
  }

  /**
   * Check staffing levels for multiple areas at once
   * @param areas - Array of areas to check
   * @param dayOfWeek - Day of week to check
   * @returns Map of area keys to staffing level results
   */
  async checkMultipleAreas(
    areas: Array<{ areaType: 'department' | 'service'; areaId: number; staffCount: number }>,
    dayOfWeek: number
  ): Promise<Map<string, StaffingLevelResult>> {
    const results = new Map<string, StaffingLevelResult>();

    for (const area of areas) {
      const key = `${area.areaType}:${area.areaId}`;
      const result = await this.checkStaffingLevel(
        area.areaType,
        area.areaId,
        dayOfWeek,
        area.staffCount
      );
      results.set(key, result);
    }

    return results;
  }

  /**
   * Get all staffing requirements for an area
   */
  async getStaffingRequirements(
    areaType: 'department' | 'service',
    areaId: number
  ): Promise<StaffingRequirement[]> {
    return this.staffingReqRepo.findByArea(areaType, areaId);
  }

  /**
   * Set staffing requirements for an area (replaces all existing)
   */
  async setStaffingRequirements(
    areaType: 'department' | 'service',
    areaId: number,
    requirements: Array<{ dayOfWeek: number; timeStart: string; timeEnd: string; requiredStaff: number }>
  ): Promise<StaffingRequirement[]> {
    return this.staffingReqRepo.setStaffingRequirementsForArea(areaType, areaId, requirements);
  }

  /**
   * Delete all staffing requirements for an area
   */
  async deleteStaffingRequirements(
    areaType: 'department' | 'service',
    areaId: number
  ): Promise<number> {
    return this.staffingReqRepo.deleteByArea(areaType, areaId);
  }

  /**
   * Parse time string (HH:MM or HH:MM:SS) to minutes since midnight
   */
  private parseTimeToMinutes(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  }

  /**
   * Check if a specific time falls within a time range
   */
  private isTimeInRange(time: string, start: string, end: string): boolean {
    const timeMinutes = this.parseTimeToMinutes(time);
    const startMinutes = this.parseTimeToMinutes(start);
    const endMinutes = this.parseTimeToMinutes(end);

    // Handle overnight shifts (e.g., 23:00 - 07:00)
    if (endMinutes < startMinutes) {
      return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
    }

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }
}

