import type { AppConfig } from '@shared/types/config';
import type { StaffMember, FixedSchedule } from '@shared/types/staff';
import type { DayRota, ManualAssignment } from '@shared/types/shift';
import type { Building } from '@shared/types/building';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';
import type { StaffAllocation, AllocationWithDetails, AreaType } from '@shared/types/allocation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(response.status, error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const api = {
  // Config
  async getConfig(): Promise<AppConfig> {
    return fetchApi<AppConfig>('/config/zero-date');
  },

  async updateZeroDate(zeroDate: string): Promise<AppConfig> {
    return fetchApi<AppConfig>('/config/zero-date', {
      method: 'PUT',
      body: JSON.stringify({ zeroDate }),
    });
  },

  // Staff
  async getAllStaff(filters?: { status?: string; group?: string; includeInactive?: boolean }): Promise<{ staff: StaffMember[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.group) params.append('group', filters.group);
    if (filters?.includeInactive) params.append('includeInactive', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ staff: StaffMember[] }>(`/staff${query}`);
  },

  async getStaffById(id: number): Promise<{ staff: StaffMember }> {
    return fetchApi<{ staff: StaffMember }>(`/staff/${id}`);
  },

  async createStaff(staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ staff: StaffMember }> {
    return fetchApi<{ staff: StaffMember }>('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
  },

  async updateStaff(id: number, updates: Partial<StaffMember>): Promise<{ staff: StaffMember }> {
    return fetchApi<{ staff: StaffMember }>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteStaff(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/staff/${id}`, {
      method: 'DELETE',
    });
  },

  // Fixed Schedules
  async getStaffSchedules(staffId: number): Promise<{ schedules: FixedSchedule[] }> {
    return fetchApi<{ schedules: FixedSchedule[] }>(`/staff/${staffId}/schedules`);
  },

  async createStaffSchedule(
    staffId: number,
    schedule: Omit<FixedSchedule, 'id' | 'staffId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ schedule: FixedSchedule }> {
    return fetchApi<{ schedule: FixedSchedule }>(`/staff/${staffId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  },

  async deleteSchedule(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/rota/schedules/${id}`, {
      method: 'DELETE',
    });
  },

  // Rota
  async getRotaForDay(date: string): Promise<DayRota> {
    return fetchApi<DayRota>(`/rota/day/${date}`);
  },

  async getRotaForRange(startDate: string, endDate: string): Promise<{ days: DayRota[] }> {
    return fetchApi<{ days: DayRota[] }>(`/rota/range?startDate=${startDate}&endDate=${endDate}`);
  },

  // Manual Assignments
  async getAssignments(startDate: string, endDate: string): Promise<{ assignments: ManualAssignment[] }> {
    return fetchApi<{ assignments: ManualAssignment[] }>(
      `/rota/assignments?startDate=${startDate}&endDate=${endDate}`
    );
  },

  async createAssignment(
    assignment: Omit<ManualAssignment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ assignment: ManualAssignment }> {
    return fetchApi<{ assignment: ManualAssignment }>('/rota/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  },

  async deleteAssignment(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/rota/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  // Buildings
  async getAllBuildings(): Promise<{ buildings: Building[] }> {
    return fetchApi<{ buildings: Building[] }>('/buildings');
  },

  async getBuildingById(id: number): Promise<{ building: Building }> {
    return fetchApi<{ building: Building }>(`/buildings/${id}`);
  },

  async createBuilding(building: { name: string; description?: string | null }): Promise<{ building: Building }> {
    return fetchApi<{ building: Building }>('/buildings', {
      method: 'POST',
      body: JSON.stringify(building),
    });
  },

  async updateBuilding(id: number, updates: { name?: string; description?: string | null }): Promise<{ building: Building }> {
    return fetchApi<{ building: Building }>(`/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteBuilding(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/buildings/${id}`, {
      method: 'DELETE',
    });
  },

  // Departments
  async getAllDepartments(filters?: { buildingId?: number }): Promise<{ departments: Department[] }> {
    const params = new URLSearchParams();
    if (filters?.buildingId) params.append('buildingId', filters.buildingId.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ departments: Department[] }>(`/departments${query}`);
  },

  async getDepartmentById(id: number): Promise<{ department: Department }> {
    return fetchApi<{ department: Department }>(`/departments/${id}`);
  },

  async createDepartment(department: { name: string; buildingId?: number | null; description?: string | null }): Promise<{ department: Department }> {
    return fetchApi<{ department: Department }>('/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    });
  },

  async updateDepartment(id: number, updates: { name?: string; buildingId?: number | null; description?: string | null }): Promise<{ department: Department }> {
    return fetchApi<{ department: Department }>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteDepartment(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/departments/${id}`, {
      method: 'DELETE',
    });
  },

  // Services
  async getAllServices(): Promise<{ services: Service[] }> {
    return fetchApi<{ services: Service[] }>('/services');
  },

  async getServiceById(id: number): Promise<{ service: Service }> {
    return fetchApi<{ service: Service }>(`/services/${id}`);
  },

  async createService(data: { name: string; description?: string | null; includeInMainRota?: boolean }): Promise<{ service: Service }> {
    return fetchApi<{ service: Service }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateService(id: number, updates: { name?: string; description?: string | null; includeInMainRota?: boolean }): Promise<{ service: Service }> {
    return fetchApi<{ service: Service }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteService(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  // Allocations
  async getStaffAllocations(staffId: number): Promise<{ allocations: AllocationWithDetails[] }> {
    return fetchApi<{ allocations: AllocationWithDetails[] }>(`/allocations/staff/${staffId}`);
  },

  async setStaffAllocations(
    staffId: number,
    allocations: Array<{ areaType: AreaType; areaId: number }>
  ): Promise<{ allocations: AllocationWithDetails[] }> {
    return fetchApi<{ allocations: AllocationWithDetails[] }>(`/allocations/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  },

  async getAreaAllocations(areaType: AreaType, areaId: number): Promise<{ allocations: StaffAllocation[] }> {
    return fetchApi<{ allocations: StaffAllocation[] }>(`/allocations/area/${areaType}/${areaId}`);
  },

  async createAllocation(staffId: number, areaType: AreaType, areaId: number): Promise<{ allocation: StaffAllocation }> {
    return fetchApi<{ allocation: StaffAllocation }>('/allocations', {
      method: 'POST',
      body: JSON.stringify({ staffId, areaType, areaId }),
    });
  },

  async deleteAllocation(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/allocations/${id}`, {
      method: 'DELETE',
    });
  },

  // Operational Hours
  async getOperationalHoursByArea(areaType: 'department' | 'service', areaId: number): Promise<{ operationalHours: any[] }> {
    return fetchApi<{ operationalHours: any[] }>(`/operational-hours/area/${areaType}/${areaId}`);
  },

  async createOperationalHours(data: { areaType: 'department' | 'service'; areaId: number; dayOfWeek: number; startTime: string; endTime: string }): Promise<{ operationalHours: any }> {
    return fetchApi<{ operationalHours: any }>('/operational-hours', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOperationalHours(id: number, updates: { dayOfWeek?: number; startTime?: string; endTime?: string }): Promise<{ operationalHours: any }> {
    return fetchApi<{ operationalHours: any }>(`/operational-hours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteOperationalHours(id: number): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/operational-hours/${id}`, {
      method: 'DELETE',
    });
  },

  async setOperationalHoursForArea(areaType: 'department' | 'service', areaId: number, hours: Array<{ dayOfWeek: number; startTime: string; endTime: string }>): Promise<{ operationalHours: any[] }> {
    return fetchApi<{ operationalHours: any[] }>(`/operational-hours/area/${areaType}/${areaId}`, {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    });
  },

  async copyOperationalHours(fromAreaType: 'department' | 'service', fromAreaId: number, toAreaType: 'department' | 'service', toAreaId: number): Promise<{ operationalHours: any[]; copied: number }> {
    return fetchApi<{ operationalHours: any[]; copied: number }>('/operational-hours/copy', {
      method: 'POST',
      body: JSON.stringify({ fromAreaType, fromAreaId, toAreaType, toAreaId }),
    });
  },

  // Contracted Hours
  async getContractedHoursByStaff(staffId: number): Promise<{ contractedHours: any[] }> {
    return fetchApi<{ contractedHours: any[] }>(`/contracted-hours/staff/${staffId}`);
  },

  async createContractedHours(data: { staffId: number; dayOfWeek: number; startTime: string; endTime: string }): Promise<{ contractedHours: any }> {
    return fetchApi<{ contractedHours: any }>('/contracted-hours', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateContractedHours(id: number, updates: { dayOfWeek?: number; startTime?: string; endTime?: string }): Promise<{ contractedHours: any }> {
    return fetchApi<{ contractedHours: any }>(`/contracted-hours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteContractedHours(id: number): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/contracted-hours/${id}`, {
      method: 'DELETE',
    });
  },

  async setContractedHoursForStaff(staffId: number, hours: Array<{ dayOfWeek: number; startTime: string; endTime: string }>): Promise<{ contractedHours: any[] }> {
    return fetchApi<{ contractedHours: any[] }>(`/contracted-hours/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    });
  },

  async copyContractedHours(fromStaffId: number, toStaffId: number): Promise<{ contractedHours: any[]; copied: number }> {
    return fetchApi<{ contractedHours: any[]; copied: number }>('/contracted-hours/copy', {
      method: 'POST',
      body: JSON.stringify({ fromStaffId, toStaffId }),
    });
  },
};

