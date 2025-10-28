import { DepartmentRepository } from '../repositories/department.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { AreaOperationalHoursRepository } from '../repositories/area-operational-hours.repository';
import { AllocationRepository } from '../repositories/allocation.repository';
import { StaffContractedHoursRepository } from '../repositories/staff-contracted-hours.repository';
import { OverrideRepository } from '../repositories/override.repository';
import { StaffRepository } from '../repositories/staff.repository';
import { AbsenceRepository } from '../repositories/absence.repository';
import { RotaService } from './rota.service';
import type { Department } from '../../shared/types/department';
import type { Service } from '../../shared/types/service';
import type { AreaOperationalHours, StaffContractedHours } from '../../shared/types/operational-hours';
import type { StaffMember } from '../../shared/types/staff';
import type { ShiftType } from '../../shared/types/shift';
import type { Absence } from '../../shared/types/absence';

export interface StaffAssignmentForArea {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  shiftType: ShiftType;
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
  }

  /**
   * Get all areas (departments and services) that should be displayed on the main rota
   * for a specific day of the week, including staff assignments for that date
   */
  async getAreasForDay(dayOfWeek: number, date?: string): Promise<AreaWithHours[]> {
    const areas: AreaWithHours[] = [];

    // Get all departments with includeInMainRota = true
    const allDepartments = await this.departmentRepo.findAll();
    const mainRotaDepartments = allDepartments.filter(d => d.includeInMainRota);

    // Get all services with includeInMainRota = true
    const allServices = await this.serviceRepo.findAll();
    const mainRotaServices = allServices.filter(s => s.includeInMainRota);

    // Get operational hours for the specific day
    const dayOperationalHours = await this.operationalHoursRepo.findByDay(dayOfWeek);

    // Get rota for the date if provided (to get staff assignments)
    let dayRota = null;
    if (date) {
      dayRota = await this.rotaService.getRotaForDate(date);
    }

    // Process departments
    for (const dept of mainRotaDepartments) {
      const deptHours = dayOperationalHours.filter(
        h => h.areaType === 'department' && h.areaId === dept.id
      );

      // Include if department has operational hours for this day OR is 24/7
      if (deptHours.length > 0 || dept.is24_7) {
        const staff = date ? await this.getStaffForArea('department', dept.id, dayRota) : [];

        areas.push({
          id: dept.id,
          name: dept.name,
          type: 'department',
          buildingId: dept.buildingId ?? undefined,
          operationalHours: dept.is24_7 ? [] : deptHours, // Empty hours for 24/7 areas
          staff,
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
        const staff = date ? await this.getStaffForArea('service', service.id, dayRota) : [];

        areas.push({
          id: service.id,
          name: service.name,
          type: 'service',
          operationalHours: service.is24_7 ? [] : serviceHours, // Empty hours for 24/7 areas
          staff,
        });
      }
    }

    // Sort by name
    areas.sort((a, b) => a.name.localeCompare(b.name));

    return areas;
  }

  /**
   * Get staff members assigned to a specific area who are working on the given date
   * Includes both permanently allocated staff and temporarily assigned pool staff
   */
  private async getStaffForArea(
    areaType: 'department' | 'service',
    areaId: number,
    dayRota: any
  ): Promise<StaffAssignmentForArea[]> {
    if (!dayRota) return [];

    const date = dayRota.date;

    // Get all staff permanently allocated to this area
    const allocations = await this.allocationRepo.findByArea(areaType, areaId);
    const allocatedStaffIds = new Set(allocations.map(a => a.staffId));

    const staffAssignments: StaffAssignmentForArea[] = [];

    // Add permanently allocated staff who are working today
    // We need to check if they're working based on their cycle, not just if they're in shift pools
    for (const allocation of allocations) {
      // Get staff with shift information
      const allStaffWithShifts = await this.staffRepo.findAllWithShifts();
      const staff = allStaffWithShifts.find(s => s.id === allocation.staffId);

      if (!staff || !staff.isActive) continue;

      // Check if this staff member is working today using the rota service
      const isWorking = await this.rotaService.isStaffWorkingOnDate(staff, date);

      if (isWorking) {
        // Fetch contracted hours for this staff member
        const contractedHours = await this.contractedHoursRepo.findByStaff(staff.id);

        // Determine shift type based on their shift assignment or default to 'day'
        let shiftType: 'day' | 'night' = 'day';
        if (staff.shift?.type) {
          shiftType = staff.shift.type;
        }

        staffAssignments.push({
          id: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          status: staff.status,
          shiftType,
          contractedHours,
        });
      }
    }

    // Get temporary assignments for this area on this date
    const temporaryAssignments = await this.overrideRepo.findByAreaAndDateRange(
      areaType,
      areaId,
      date,
      date
    );

    // Add temporarily assigned pool staff
    for (const assignment of temporaryAssignments) {
      // Skip if already in the list (shouldn't happen, but safety check)
      if (staffAssignments.some(s => s.id === assignment.staffId)) {
        continue;
      }

      // Get the staff member details
      const staff = await this.staffRepo.findById(assignment.staffId);
      if (!staff) continue;

      // Fetch contracted hours
      const contractedHours = await this.contractedHoursRepo.findByStaff(assignment.staffId);

      staffAssignments.push({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        status: staff.status,
        shiftType: assignment.shiftType,
        contractedHours,
      });
    }

    // Fetch absence information for all staff (any absence that overlaps with this date)
    const staffIds = staffAssignments.map(s => s.id);
    const absenceMap = await this.absenceRepo.findAbsencesForDate(staffIds, date);

    // Attach absence information to staff assignments
    staffAssignments.forEach((staff) => {
      const absence = absenceMap.get(staff.id);
      if (absence) {
        staff.currentAbsence = absence;
      }
    });

    // Sort by shift type (day first, then night), then by name
    staffAssignments.sort((a, b) => {
      if (a.shiftType !== b.shiftType) {
        return a.shiftType === 'day' ? -1 : 1;
      }
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
}

