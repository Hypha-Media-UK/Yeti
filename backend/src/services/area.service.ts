import { DepartmentRepository } from '../repositories/department.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { AreaOperationalHoursRepository } from '../repositories/area-operational-hours.repository';
import { AllocationRepository } from '../repositories/allocation.repository';
import { RotaService } from './rota.service';
import type { Department } from '../../shared/types/department';
import type { Service } from '../../shared/types/service';
import type { AreaOperationalHours } from '../../shared/types/operational-hours';
import type { StaffMember, ShiftGroup } from '../../shared/types/staff';

export interface StaffAssignmentForArea {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  group: ShiftGroup | null;
  shiftType: ShiftGroup;
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
  private rotaService: RotaService;

  constructor() {
    this.departmentRepo = new DepartmentRepository();
    this.serviceRepo = new ServiceRepository();
    this.operationalHoursRepo = new AreaOperationalHoursRepository();
    this.allocationRepo = new AllocationRepository();
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

      // Only include if department has operational hours for this day
      if (deptHours.length > 0) {
        const staff = date ? await this.getStaffForArea('department', dept.id, dayRota) : [];

        areas.push({
          id: dept.id,
          name: dept.name,
          type: 'department',
          buildingId: dept.buildingId ?? undefined,
          operationalHours: deptHours,
          staff,
        });
      }
    }

    // Process services
    for (const service of mainRotaServices) {
      const serviceHours = dayOperationalHours.filter(
        h => h.areaType === 'service' && h.areaId === service.id
      );

      // Only include if service has operational hours for this day
      if (serviceHours.length > 0) {
        const staff = date ? await this.getStaffForArea('service', service.id, dayRota) : [];

        areas.push({
          id: service.id,
          name: service.name,
          type: 'service',
          operationalHours: serviceHours,
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
   */
  private async getStaffForArea(
    areaType: 'department' | 'service',
    areaId: number,
    dayRota: any
  ): Promise<StaffAssignmentForArea[]> {
    if (!dayRota) return [];

    // Get all staff allocated to this area
    const allocations = await this.allocationRepo.findByArea(areaType, areaId);
    const allocatedStaffIds = new Set(allocations.map(a => a.staffId));

    // Get all staff working on this date from the rota
    const allShifts = [...dayRota.dayShifts, ...dayRota.nightShifts];

    // Filter to only staff allocated to this area
    const staffAssignments: StaffAssignmentForArea[] = allShifts
      .filter(shift => allocatedStaffIds.has(shift.staff.id))
      .map(shift => ({
        id: shift.staff.id,
        firstName: shift.staff.firstName,
        lastName: shift.staff.lastName,
        status: shift.staff.status,
        group: shift.staff.group,
        shiftType: shift.shiftType,
      }));

    // Sort by shift type (Day first, then Night), then by name
    staffAssignments.sort((a, b) => {
      if (a.shiftType !== b.shiftType) {
        return a.shiftType === 'Day' ? -1 : 1;
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

