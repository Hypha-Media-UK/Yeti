import { DepartmentRepository } from '../repositories/department.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { AreaOperationalHoursRepository } from '../repositories/area-operational-hours.repository';
import type { Department } from '../../shared/types/department';
import type { Service } from '../../shared/types/service';
import type { AreaOperationalHours } from '../../shared/types/operational-hours';

export interface AreaWithHours {
  id: number;
  name: string;
  type: 'department' | 'service';
  buildingId?: number;
  operationalHours: AreaOperationalHours[];
}

export class AreaService {
  private departmentRepo: DepartmentRepository;
  private serviceRepo: ServiceRepository;
  private operationalHoursRepo: AreaOperationalHoursRepository;

  constructor() {
    this.departmentRepo = new DepartmentRepository();
    this.serviceRepo = new ServiceRepository();
    this.operationalHoursRepo = new AreaOperationalHoursRepository();
  }

  /**
   * Get all areas (departments and services) that should be displayed on the main rota
   * for a specific day of the week
   */
  async getAreasForDay(dayOfWeek: number): Promise<AreaWithHours[]> {
    const areas: AreaWithHours[] = [];

    // Get all departments with includeInMainRota = true
    const allDepartments = await this.departmentRepo.findAll();
    const mainRotaDepartments = allDepartments.filter(d => d.includeInMainRota);

    // Get all services with includeInMainRota = true
    const allServices = await this.serviceRepo.findAll();
    const mainRotaServices = allServices.filter(s => s.includeInMainRota);

    // Get operational hours for the specific day
    const dayOperationalHours = await this.operationalHoursRepo.findByDay(dayOfWeek);

    // Process departments
    for (const dept of mainRotaDepartments) {
      const deptHours = dayOperationalHours.filter(
        h => h.areaType === 'department' && h.areaId === dept.id
      );

      // Only include if department has operational hours for this day
      if (deptHours.length > 0) {
        areas.push({
          id: dept.id,
          name: dept.name,
          type: 'department',
          buildingId: dept.buildingId ?? undefined,
          operationalHours: deptHours,
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
        areas.push({
          id: service.id,
          name: service.name,
          type: 'service',
          operationalHours: serviceHours,
        });
      }
    }

    // Sort by name
    areas.sort((a, b) => a.name.localeCompare(b.name));

    return areas;
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

