import { DepartmentRepository } from '../repositories/department.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { AreaOperationalHoursRepository } from '../repositories/area-operational-hours.repository';
import { AllocationRepository } from '../repositories/allocation.repository';
import { StaffContractedHoursRepository } from '../repositories/staff-contracted-hours.repository';
import { OverrideRepository } from '../repositories/override.repository';
import { StaffRepository } from '../repositories/staff.repository';
import { AbsenceRepository } from '../repositories/absence.repository';
import { RotaService } from './rota.service';
import { ShiftTimeService } from './rota/shift-time.service';
import { StaffingLevelService } from './staffing-level.service';
import type { Department } from '../../shared/types/department';
import type { Service } from '../../shared/types/service';
import type { AreaOperationalHours, StaffContractedHours } from '../../shared/types/operational-hours';
import type { StaffMember } from '../../shared/types/staff';
import type { ShiftType, ManualAssignment } from '../../shared/types/shift';
import type { Absence } from '../../shared/types/absence';

export interface StaffAssignmentForArea {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  shiftType: ShiftType;
  shiftStart: string;
  shiftEnd: string;
  contractedHours: StaffContractedHours[];
  currentAbsence?: Absence | null;
}

export interface AreaWithHours {
  id: number;
  name: string;
  type: 'department' | 'service';
  buildingId?: number;
  operationalHours: AreaOperationalHours[];
  staff?: StaffAssignmentForArea[];
  isUnderstaffed?: boolean;
}

export class AreaService {
  private departmentRepo: DepartmentRepository;
  private serviceRepo: ServiceRepository;
  private operationalHoursRepo: AreaOperationalHoursRepository;
  private allocationRepo: AllocationRepository;
  private contractedHoursRepo: StaffContractedHoursRepository;
  private overrideRepo: OverrideRepository;
  private staffRepo: StaffRepository;
  private absenceRepo: AbsenceRepository;
  private rotaService: RotaService;
  private shiftTimeService: ShiftTimeService;
  private staffingLevelService: StaffingLevelService;

  constructor() {
    this.departmentRepo = new DepartmentRepository();
    this.serviceRepo = new ServiceRepository();
    this.operationalHoursRepo = new AreaOperationalHoursRepository();
    this.allocationRepo = new AllocationRepository();
    this.contractedHoursRepo = new StaffContractedHoursRepository();
    this.overrideRepo = new OverrideRepository();
    this.staffRepo = new StaffRepository();
    this.absenceRepo = new AbsenceRepository();
    this.rotaService = new RotaService();
    this.shiftTimeService = new ShiftTimeService();
    this.staffingLevelService = new StaffingLevelService();
  }

  /**
   * Get all areas (departments and services) that should be displayed on the main rota
   * for a specific day of the week, optionally including staff assignments for that date
   * @param dayOfWeek - Day of week (1-7, Monday-Sunday)
   * @param date - Optional date string (YYYY-MM-DD)
   * @param includeStaff - Whether to include staff assignments (default: true if date is provided)
   */
  async getAreasForDay(dayOfWeek: number, date?: string, includeStaff?: boolean): Promise<AreaWithHours[]> {
    const startTime = Date.now();
    const areas: AreaWithHours[] = [];

    // Get all departments with includeInMainRota = true
    const allDepartments = await this.departmentRepo.findAll();
    const mainRotaDepartments = allDepartments.filter(d => d.includeInMainRota);

    // Get all services with includeInMainRota = true
    const allServices = await this.serviceRepo.findAll();
    const mainRotaServices = allServices.filter(s => s.includeInMainRota);

    // Get operational hours for the specific day
    const dayOperationalHours = await this.operationalHoursRepo.findByDay(dayOfWeek);

    // Determine if we should include staff (default to true if date is provided, unless explicitly set to false)
    const shouldIncludeStaff = includeStaff !== undefined ? includeStaff : !!date;

    // Get rota for the date if provided (to get staff assignments)
    let dayRota = null;
    if (date && shouldIncludeStaff) {
      dayRota = await this.rotaService.getRotaForDate(date);
    }

    // OPTIMIZATION: Fetch all data once upfront to avoid N+1 queries
    let allStaffMap: Map<number, StaffMember> | null = null;
    let allContractedHoursMap: Map<number, StaffContractedHours[]> | null = null;
    let manualAssignmentsMap: Map<number, ManualAssignment[]> | null = null;
    let temporaryAssignmentsByArea: Map<string, ManualAssignment[]> | null = null;
    let allocationsByArea: Map<string, StaffAllocation[]> | null = null;
    let allAbsencesMap: Map<number, Absence | null> | null = null;
    let appZeroDate: string | null = null;

    // Check if any area requires minimum staffing
    const anyAreaRequiresStaffing = date && (
      mainRotaDepartments.some(d => d.requiresMinimumStaffing) ||
      mainRotaServices.some(s => s.requiresMinimumStaffing)
    );

    // Fetch staff data if we need to include it OR if we need to check staffing levels
    if (date && (shouldIncludeStaff || anyAreaRequiresStaffing)) {
      const fetchStart = Date.now();

      // Fetch all data in parallel
      const [allStaff, allContractedHours, manualAssignments, allAllocations, zeroDate] = await Promise.all([
        this.staffRepo.findAllWithShifts(),
        this.contractedHoursRepo.findAll(),
        this.rotaService.getManualAssignmentsForDate(date),
        this.allocationRepo.findAll(),
        this.rotaService.getAppZeroDate()
      ]);

      // Build staff map
      allStaffMap = new Map(allStaff.map(s => [s.id, s]));

      // Build contracted hours map
      allContractedHoursMap = new Map();
      for (const hours of allContractedHours) {
        if (!allContractedHoursMap.has(hours.staffId)) {
          allContractedHoursMap.set(hours.staffId, []);
        }
        allContractedHoursMap.get(hours.staffId)!.push(hours);
      }

      // Build manual assignments map (by staff ID for working status checks)
      manualAssignmentsMap = new Map();
      for (const assignment of manualAssignments) {
        if (!manualAssignmentsMap.has(assignment.staffId)) {
          manualAssignmentsMap.set(assignment.staffId, []);
        }
        manualAssignmentsMap.get(assignment.staffId)!.push(assignment);
      }

      // Build temporary assignments map (by area for area staff lists)
      temporaryAssignmentsByArea = new Map();
      for (const assignment of manualAssignments) {
        if (assignment.areaType && assignment.areaId) {
          const key = `${assignment.areaType}:${assignment.areaId}`;
          if (!temporaryAssignmentsByArea.has(key)) {
            temporaryAssignmentsByArea.set(key, []);
          }
          temporaryAssignmentsByArea.get(key)!.push(assignment);
        }
      }

      // Build allocations map (by area for area staff lists)
      allocationsByArea = new Map();
      for (const allocation of allAllocations) {
        const key = `${allocation.areaType}:${allocation.areaId}`;
        if (!allocationsByArea.has(key)) {
          allocationsByArea.set(key, []);
        }
        allocationsByArea.get(key)!.push(allocation);
      }

      // Pre-fetch absences for all staff on this date
      const allStaffIds = Array.from(allStaffMap.keys());
      allAbsencesMap = await this.absenceRepo.findAbsencesForDate(allStaffIds, date);

      appZeroDate = zeroDate;

      console.log(`[PERF] Fetched all data in ${Date.now() - fetchStart}ms: ${allStaff.length} staff, ${allContractedHours.length} contracted hours, ${manualAssignments.length} manual assignments, ${allAllocations.length} allocations, ${allAbsencesMap.size} absences checked`);
    }

    // Process departments
    for (const dept of mainRotaDepartments) {
      const deptHours = dayOperationalHours.filter(
        h => h.areaType === 'department' && h.areaId === dept.id
      );

      // Include if department has operational hours for this day OR is 24/7
      if (deptHours.length > 0 || dept.is24_7) {
        const staff = (date && shouldIncludeStaff) ? await this.getStaffForArea(
          'department',
          dept.id,
          dayRota,
          allStaffMap!,
          allContractedHoursMap!,
          manualAssignmentsMap!,
          temporaryAssignmentsByArea!,
          allocationsByArea!,
          allAbsencesMap!,
          appZeroDate!
        ) : [];

        // Check staffing levels if department requires minimum staffing
        let isUnderstaffed = false;
        if (dept.requiresMinimumStaffing && date) {
          // If we already have staff data, use it; otherwise fetch it just for counting
          let staffForCounting = staff;
          if (!shouldIncludeStaff) {
            staffForCounting = await this.getStaffForArea(
              'department',
              dept.id,
              dayRota,
              allStaffMap!,
              allContractedHoursMap!,
              manualAssignmentsMap!,
              temporaryAssignmentsByArea!,
              allocationsByArea!,
              allAbsencesMap!,
              appZeroDate!
            );
          }
          const staffingResult = await this.staffingLevelService.checkStaffingLevel(
            'department',
            dept.id,
            dayOfWeek,
            staffForCounting.filter(s => !s.currentAbsence).length // Count only present staff
          );
          isUnderstaffed = staffingResult.isUnderstaffed;
        }

        areas.push({
          id: dept.id,
          name: dept.name,
          type: 'department',
          buildingId: dept.buildingId ?? undefined,
          operationalHours: dept.is24_7 ? [] : deptHours, // Empty hours for 24/7 areas
          staff: shouldIncludeStaff ? staff : undefined,
          isUnderstaffed: dept.requiresMinimumStaffing ? isUnderstaffed : undefined,
        });
      }
    }

    // Process services
    for (const service of mainRotaServices) {
      const serviceHours = dayOperationalHours.filter(
        h => h.areaType === 'service' && h.areaId === service.id
      );

      // Include if service has operational hours for this day OR is 24/7
      if (serviceHours.length > 0 || service.is24_7) {
        const staff = (date && shouldIncludeStaff) ? await this.getStaffForArea(
          'service',
          service.id,
          dayRota,
          allStaffMap!,
          allContractedHoursMap!,
          manualAssignmentsMap!,
          temporaryAssignmentsByArea!,
          allocationsByArea!,
          allAbsencesMap!,
          appZeroDate!
        ) : [];

        // Check staffing levels if service requires minimum staffing
        let isUnderstaffed = false;
        if (service.requiresMinimumStaffing && date) {
          // If we already have staff data, use it; otherwise fetch it just for counting
          let staffForCounting = staff;
          if (!shouldIncludeStaff) {
            staffForCounting = await this.getStaffForArea(
              'service',
              service.id,
              dayRota,
              allStaffMap!,
              allContractedHoursMap!,
              manualAssignmentsMap!,
              temporaryAssignmentsByArea!,
              allocationsByArea!,
              allAbsencesMap!,
              appZeroDate!
            );
          }
          const staffingResult = await this.staffingLevelService.checkStaffingLevel(
            'service',
            service.id,
            dayOfWeek,
            staffForCounting.filter(s => !s.currentAbsence).length // Count only present staff
          );
          isUnderstaffed = staffingResult.isUnderstaffed;
        }

        areas.push({
          id: service.id,
          name: service.name,
          type: 'service',
          operationalHours: service.is24_7 ? [] : serviceHours, // Empty hours for 24/7 areas
          staff: shouldIncludeStaff ? staff : undefined,
          isUnderstaffed: service.requiresMinimumStaffing ? isUnderstaffed : undefined,
        });
      }
    }

    // Sort by: 1) earliest operational hours start time, 2) name
    areas.sort((a, b) => {
      // Get earliest start time for each area
      const aStartTime = a.operationalHours.length > 0
        ? a.operationalHours.reduce((earliest, h) => h.startTime < earliest ? h.startTime : earliest, a.operationalHours[0].startTime)
        : '00:00:00'; // 24/7 areas default to midnight

      const bStartTime = b.operationalHours.length > 0
        ? b.operationalHours.reduce((earliest, h) => h.startTime < earliest ? h.startTime : earliest, b.operationalHours[0].startTime)
        : '00:00:00'; // 24/7 areas default to midnight

      // First, sort by start time
      if (aStartTime !== bStartTime) {
        return aStartTime.localeCompare(bStartTime);
      }

      // Then, sort by name
      return a.name.localeCompare(b.name);
    });

    const totalTime = Date.now() - startTime;
    console.log(`[PERF] getAreasForDay completed in ${totalTime}ms (${areas.length} areas, ${areas.reduce((sum, a) => sum + (a.staff?.length || 0), 0)} total staff)`);

    return areas;
  }

  /**
   * Get staff members assigned to a specific area who are working on the given date
   * Includes both permanently allocated staff and temporarily assigned pool staff
   * OPTIMIZED: Uses pre-fetched data maps to avoid N+1 queries
   */
  private async getStaffForArea(
    areaType: 'department' | 'service',
    areaId: number,
    dayRota: any,
    allStaffMap: Map<number, StaffMember>,
    allContractedHoursMap: Map<number, StaffContractedHours[]>,
    manualAssignmentsMap: Map<number, ManualAssignment[]>,
    temporaryAssignmentsByArea: Map<string, ManualAssignment[]>,
    allocationsByArea: Map<string, StaffAllocation[]>,
    allAbsencesMap: Map<number, Absence | null>,
    appZeroDate: string
  ): Promise<StaffAssignmentForArea[]> {
    if (!dayRota) return [];

    const date = dayRota.date;

    // OPTIMIZED: Get allocations from pre-fetched map
    const areaKey = `${areaType}:${areaId}`;
    const allocations = allocationsByArea.get(areaKey) || [];
    const allocatedStaffIds = new Set(allocations.map(a => a.staffId));

    const staffAssignments: StaffAssignmentForArea[] = [];

    // Add permanently allocated staff who are working today
    // We need to check if they're working based on their cycle, not just if they're in shift pools
    const checkWorkingStart = Date.now();
    let workingChecks = 0;
    for (const allocation of allocations) {
      // OPTIMIZED: Get staff from pre-fetched map instead of querying database
      const staff = allStaffMap.get(allocation.staffId);

      if (!staff || !staff.isActive) continue;

      // Check if this staff member is working today using the rota service
      // OPTIMIZED: Pass pre-fetched data to avoid database queries
      workingChecks++;
      const isWorking = await this.rotaService.isStaffWorkingOnDate(staff, date, {
        manualAssignmentsMap,
        contractedHoursMap: allContractedHoursMap,
        appZeroDate
      });

      if (isWorking) {
        // OPTIMIZED: Get contracted hours from pre-fetched map instead of querying database
        const contractedHours = allContractedHoursMap.get(staff.id) || [];

        // Determine shift type based on their shift assignment or default to 'day'
        let shiftType: 'day' | 'night' = 'day';
        if (staff.shift?.type) {
          shiftType = staff.shift.type;
        }

        // Get shift times for this staff member
        const times = await this.shiftTimeService.getShiftTimesForStaff(
          staff,
          shiftType,
          date,
          { contractedHoursMap: allContractedHoursMap }
        );

        // Default times if none found
        const shiftStart = times?.start || (shiftType === 'day' ? '08:00:00' : '20:00:00');
        const shiftEnd = times?.end || (shiftType === 'day' ? '20:00:00' : '08:00:00');

        staffAssignments.push({
          id: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          status: staff.status,
          shiftType,
          shiftStart,
          shiftEnd,
          contractedHours,
        });
      }
    }
    console.log(`[PERF] Checked ${workingChecks} staff working status in ${Date.now() - checkWorkingStart}ms for area ${areaType}:${areaId}`);

    // OPTIMIZED: Get temporary assignments from pre-fetched map (reuse areaKey from above)
    const temporaryAssignments = temporaryAssignmentsByArea.get(areaKey) || [];

    // Add temporarily assigned pool staff
    for (const assignment of temporaryAssignments) {
      // Skip if already in the list (shouldn't happen, but safety check)
      if (staffAssignments.some(s => s.id === assignment.staffId)) {
        continue;
      }

      // OPTIMIZED: Get staff from pre-fetched map instead of querying database
      const staff = allStaffMap.get(assignment.staffId);
      if (!staff) continue;

      // OPTIMIZED: Get contracted hours from pre-fetched map instead of querying database
      const contractedHours = allContractedHoursMap.get(assignment.staffId) || [];

      // Priority 1: Use allocation times if this is a temporary area assignment with custom times
      let shiftStart: string;
      let shiftEnd: string;

      if (assignment.startTime && assignment.endTime) {
        // Use the allocation's specific times
        shiftStart = assignment.startTime;
        shiftEnd = assignment.endTime;
      } else {
        // Priority 2: Get shift times for this staff member (contracted hours or default)
        const times = await this.shiftTimeService.getShiftTimesForStaff(
          staff,
          assignment.shiftType,
          date,
          { contractedHoursMap: allContractedHoursMap }
        );

        // Priority 3: Default times if none found
        shiftStart = times?.start || (assignment.shiftType === 'day' ? '08:00:00' : '20:00:00');
        shiftEnd = times?.end || (assignment.shiftType === 'day' ? '20:00:00' : '08:00:00');
      }

      staffAssignments.push({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        status: staff.status,
        shiftType: assignment.shiftType,
        shiftStart,
        shiftEnd,
        contractedHours,
      });
    }

    // OPTIMIZED: Attach absence information from pre-fetched map
    staffAssignments.forEach((staff) => {
      const absence = allAbsencesMap.get(staff.id);
      if (absence) {
        staff.currentAbsence = absence;
      }
    });

    // Sort by: 1) shift type (day first, then night), 2) staff type (supervisors first), 3) start time, 4) name
    // Note: Absent staff are separated in the frontend and displayed at the bottom
    // Note: We don't sort by offset here because area assignments don't have the full shift information
    staffAssignments.sort((a, b) => {
      // 1. Sort by shift type
      if (a.shiftType !== b.shiftType) {
        return a.shiftType === 'day' ? -1 : 1;
      }

      // 2. Sort by staff type - Supervisors first, then others
      const aIsSupervisor = a.status === 'Supervisor';
      const bIsSupervisor = b.status === 'Supervisor';
      if (aIsSupervisor && !bIsSupervisor) return -1;
      if (!aIsSupervisor && bIsSupervisor) return 1;

      // 3. Sort by start time (earlier shifts first)
      if (a.shiftStart !== b.shiftStart) {
        return a.shiftStart.localeCompare(b.shiftStart);
      }

      // 4. Sort by name
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

    return staffAssignments;
  }

  /**
   * Get all areas that should be displayed on the main rota
   * (regardless of day - for general display)
   */
  async getAllMainRotaAreas(): Promise<Array<{ id: number; name: string; type: 'department' | 'service'; buildingId?: number }>> {
    const areas: Array<{ id: number; name: string; type: 'department' | 'service'; buildingId?: number }> = [];

    // Get all departments with includeInMainRota = true
    const allDepartments = await this.departmentRepo.findAll();
    const mainRotaDepartments = allDepartments.filter(d => d.includeInMainRota);

    // Get all services with includeInMainRota = true
    const allServices = await this.serviceRepo.findAll();
    const mainRotaServices = allServices.filter(s => s.includeInMainRota);

    // Add departments
    for (const dept of mainRotaDepartments) {
      areas.push({
        id: dept.id,
        name: dept.name,
        type: 'department',
        buildingId: dept.buildingId ?? undefined,
      });
    }

    // Add services
    for (const service of mainRotaServices) {
      areas.push({
        id: service.id,
        name: service.name,
        type: 'service',
      });
    }

    // Sort by name
    areas.sort((a, b) => a.name.localeCompare(b.name));

    return areas;
  }

  /**
   * Get staff members assigned to a specific area who are working on the given date
   * This is a standalone method for loading staff for a single area (used by the progressive loading endpoint)
   */
  async getStaffForSingleArea(
    areaType: 'department' | 'service',
    areaId: number,
    date: string
  ): Promise<StaffAssignmentForArea[]> {
    const startTime = Date.now();
    console.log(`[PERF] getStaffForSingleArea started for ${areaType}:${areaId} on ${date}`);

    // Fetch all required data in parallel
    const [allStaff, allContractedHours, manualAssignments, allAllocations, appZeroDate] = await Promise.all([
      this.staffRepo.findAllWithShifts(),
      this.contractedHoursRepo.findAll(),
      this.rotaService.getManualAssignmentsForDate(date),
      this.allocationRepo.findAll(),
      this.rotaService.getAppZeroDate()
    ]);

    // Build Maps for O(1) lookups
    const allStaffMap = new Map<number, StaffMember>();
    allStaff.forEach(s => allStaffMap.set(s.id, s));

    const allContractedHoursMap = new Map<number, StaffContractedHours[]>();
    allContractedHours.forEach(ch => {
      const existing = allContractedHoursMap.get(ch.staffId) || [];
      existing.push(ch);
      allContractedHoursMap.set(ch.staffId, existing);
    });

    const manualAssignmentsMap = new Map<number, ManualAssignment[]>();
    manualAssignments.forEach(ma => {
      const existing = manualAssignmentsMap.get(ma.staffId) || [];
      existing.push(ma);
      manualAssignmentsMap.set(ma.staffId, existing);
    });

    // Build map of temporary assignments by area
    const temporaryAssignmentsByArea = new Map<string, ManualAssignment[]>();
    manualAssignments.forEach(ma => {
      if (ma.areaType && ma.areaId) {
        const areaKey = `${ma.areaType}:${ma.areaId}`;
        const existing = temporaryAssignmentsByArea.get(areaKey) || [];
        existing.push(ma);
        temporaryAssignmentsByArea.set(areaKey, existing);
      }
    });

    // Build map of allocations by area
    const allocationsByArea = new Map<string, any[]>();
    allAllocations.forEach(allocation => {
      const areaKey = `${allocation.areaType}:${allocation.areaId}`;
      const existing = allocationsByArea.get(areaKey) || [];
      existing.push(allocation);
      allocationsByArea.set(areaKey, existing);
    });

    // Pre-fetch absences for all staff on this date
    const allStaffIds = Array.from(allStaffMap.keys());
    const allAbsencesMap = await this.absenceRepo.findAbsencesForDate(allStaffIds, date);

    console.log(`[PERF] Fetched all data in ${Date.now() - startTime}ms`);

    // Create a mock dayRota object for compatibility with getStaffForArea
    const dayRota = { date };

    // Call the existing getStaffForArea method
    const staff = await this.getStaffForArea(
      areaType,
      areaId,
      dayRota,
      allStaffMap,
      allContractedHoursMap,
      manualAssignmentsMap,
      temporaryAssignmentsByArea,
      allocationsByArea,
      allAbsencesMap,
      appZeroDate
    );

    const totalTime = Date.now() - startTime;
    console.log(`[PERF] getStaffForSingleArea completed in ${totalTime}ms (${staff.length} staff)`);

    return staff;
  }
}

