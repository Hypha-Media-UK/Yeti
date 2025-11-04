import type { Building } from './building';

export interface Department {
  id: number;
  name: string;
  buildingId: number | null;
  description: string | null;
  includeInMainRota: boolean;
  includeInTasks: boolean;
  mostFrequentTaskTypeId: number | null;
  is24_7: boolean;
  requiresMinimumStaffing: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentWithBuilding extends Department {
  building: Building | null;
}

export interface CreateDepartmentDto {
  name: string;
  buildingId?: number | null;
  description?: string | null;
}

export interface UpdateDepartmentDto {
  name?: string;
  buildingId?: number | null;
  description?: string | null;
  includeInMainRota?: boolean;
  includeInTasks?: boolean;
  mostFrequentTaskTypeId?: number | null;
  is24_7?: boolean;
  requiresMinimumStaffing?: boolean;
  isActive?: boolean;
}

