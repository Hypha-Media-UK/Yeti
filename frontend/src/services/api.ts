import type { AppConfig } from '@shared/types/config';
import type { StaffMember, FixedSchedule } from '@shared/types/staff';
import type { DayRota, ManualAssignment, Shift, CreateTemporaryAssignmentDto } from '@shared/types/shift';
import type { Building } from '@shared/types/building';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';
import type { StaffAllocation, AllocationWithDetails, AreaType } from '@shared/types/allocation';
import type { Absence, CreateAbsenceRequest, UpdateAbsenceRequest } from '@shared/types/absence';
import type {
  TaskTypeWithItems,
  TaskType,
  TaskItem,
  CreateTaskTypeInput,
  UpdateTaskTypeInput,
  CreateTaskItemInput,
  UpdateTaskItemInput,
} from '@shared/types/task-config';

// Use empty string for production (same domain), localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000';

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

  async getShiftTimes(): Promise<{ dayShiftStart: string; dayShiftEnd: string; nightShiftStart: string; nightShiftEnd: string }> {
    return fetchApi<{ dayShiftStart: string; dayShiftEnd: string; nightShiftStart: string; nightShiftEnd: string }>('/config/shift-times');
  },

  async updateShiftTimes(times: { dayShiftStart: string; dayShiftEnd: string; nightShiftStart: string; nightShiftEnd: string }): Promise<{ dayShiftStart: string; dayShiftEnd: string; nightShiftStart: string; nightShiftEnd: string }> {
    return fetchApi<{ dayShiftStart: string; dayShiftEnd: string; nightShiftStart: string; nightShiftEnd: string }>('/config/shift-times', {
      method: 'PUT',
      body: JSON.stringify(times),
    });
  },

  // Staff
  async getAllStaff(filters?: { status?: string; includeInactive?: boolean }): Promise<{ staff: StaffMember[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
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

  async deleteStaff(id: number, hardDelete = false): Promise<{ success: boolean }> {
    const url = hardDelete ? `/staff/${id}?hard=true` : `/staff/${id}`;
    return fetchApi<{ success: boolean }>(url, {
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

  async createTemporaryAssignment(
    assignment: CreateTemporaryAssignmentDto
  ): Promise<{ assignment: ManualAssignment }> {
    return fetchApi<{ assignment: ManualAssignment }>('/rota/assignments/temporary', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  },

  async getTemporaryAssignments(staffId: number, date: string): Promise<{ assignments: ManualAssignment[] }> {
    return fetchApi<{ assignments: ManualAssignment[] }>(`/rota/assignments/temporary/${staffId}?date=${date}`);
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

  async createDepartment(department: { name: string; buildingId?: number | null; description?: string | null; includeInMainRota?: boolean; is24_7?: boolean }): Promise<{ department: Department }> {
    return fetchApi<{ department: Department }>('/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    });
  },

  async updateDepartment(id: number, updates: { name?: string; buildingId?: number | null; description?: string | null; includeInMainRota?: boolean; is24_7?: boolean }): Promise<{ department: Department }> {
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

  async createService(data: { name: string; description?: string | null; includeInMainRota?: boolean; is24_7?: boolean }): Promise<{ service: Service }> {
    return fetchApi<{ service: Service }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateService(id: number, updates: { name?: string; description?: string | null; includeInMainRota?: boolean; is24_7?: boolean }): Promise<{ service: Service }> {
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

  // Staffing Requirements
  async getStaffingRequirements(areaType: 'department' | 'service', areaId: number): Promise<{ requirements: any[] }> {
    return fetchApi<{ requirements: any[] }>(`/${areaType}s/${areaId}/staffing-requirements`);
  },

  async setStaffingRequirements(areaType: 'department' | 'service', areaId: number, requirements: Array<{ dayOfWeek: number; startTime: string; endTime: string; minimumStaff: number }>): Promise<{ requirements: any[] }> {
    return fetchApi<{ requirements: any[] }>(`/${areaType}s/${areaId}/staffing-requirements`, {
      method: 'PUT',
      body: JSON.stringify({ requirements }),
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

  // Areas
  async getMainRotaAreas(): Promise<{ areas: Array<{ id: number; name: string; type: 'department' | 'service'; buildingId?: number }> }> {
    return fetchApi<{ areas: Array<{ id: number; name: string; type: 'department' | 'service'; buildingId?: number }> }>('/areas/main-rota');
  },

  async getMainRotaAreasForDay(dayOfWeek: number, date?: string, includeStaff?: boolean): Promise<{ areas: any[] }> {
    let url = `/areas/main-rota/day/${dayOfWeek}`;
    const params = new URLSearchParams();

    if (date) {
      params.append('date', date);
    }
    if (includeStaff !== undefined) {
      params.append('includeStaff', includeStaff.toString());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return fetchApi<{ areas: any[] }>(url);
  },

  async getAreaStaff(areaType: 'department' | 'service', areaId: number, date: string): Promise<{ staff: any[] }> {
    return fetchApi<{ staff: any[] }>(`/areas/${areaType}/${areaId}/staff?date=${date}`);
  },

  // Shifts
  async getShifts(): Promise<{ shifts: Shift[] }> {
    return fetchApi<{ shifts: Shift[] }>('/shifts');
  },

  async getShiftById(id: number): Promise<{ shift: Shift }> {
    return fetchApi<{ shift: Shift }>(`/shifts/${id}`);
  },

  async getShiftsByType(type: 'day' | 'night'): Promise<{ shifts: Shift[] }> {
    return fetchApi<{ shifts: Shift[] }>(`/shifts/type/${type}`);
  },

  async createShift(data: { name: string; type: 'day' | 'night'; color?: string; description?: string | null }): Promise<{ shift: Shift }> {
    return fetchApi<{ shift: Shift }>('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateShift(id: number, updates: { name?: string; type?: 'day' | 'night'; color?: string; description?: string | null; isActive?: boolean }): Promise<{ shift: Shift }> {
    return fetchApi<{ shift: Shift }>(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteShift(id: number): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/shifts/${id}`, {
      method: 'DELETE',
    });
  },

  async getShiftStaffCount(id: number): Promise<{ count: number }> {
    return fetchApi<{ count: number }>(`/shifts/${id}/staff-count`);
  },

  // Absences
  async getAbsencesByStaffId(staffId: number): Promise<Absence[]> {
    return fetchApi<Absence[]>(`/absences/staff/${staffId}`);
  },

  async getAbsencesByStaffIdAndDateRange(staffId: number, startDate: string, endDate: string): Promise<Absence[]> {
    return fetchApi<Absence[]>(`/absences/staff/${staffId}/range?startDate=${startDate}&endDate=${endDate}`);
  },

  async getActiveAbsence(staffId: number, datetime?: string): Promise<Absence | null> {
    const url = datetime
      ? `/absences/staff/${staffId}/active?datetime=${datetime}`
      : `/absences/staff/${staffId}/active`;
    return fetchApi<Absence | null>(url);
  },

  async createAbsence(data: CreateAbsenceRequest): Promise<Absence> {
    return fetchApi<Absence>('/absences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAbsence(id: number, data: UpdateAbsenceRequest): Promise<Absence> {
    return fetchApi<Absence>(`/absences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAbsence(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/absences/${id}`, {
      method: 'DELETE',
    });
  },

  // Task Configuration
  async getTaskTypes(): Promise<{ taskTypes: TaskTypeWithItems[] }> {
    return fetchApi<{ taskTypes: TaskTypeWithItems[] }>('/task-config/types');
  },

  async getTaskTypeById(id: number): Promise<{ taskType: TaskTypeWithItems }> {
    return fetchApi<{ taskType: TaskTypeWithItems }>(`/task-config/types/${id}`);
  },

  async createTaskType(input: CreateTaskTypeInput): Promise<{ taskType: TaskType }> {
    return fetchApi<{ taskType: TaskType }>('/task-config/types', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateTaskType(id: number, input: UpdateTaskTypeInput): Promise<{ taskType: TaskType }> {
    return fetchApi<{ taskType: TaskType }>(`/task-config/types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteTaskType(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/task-config/types/${id}`, {
      method: 'DELETE',
    });
  },

  async createTaskItem(input: CreateTaskItemInput): Promise<{ taskItem: TaskItem }> {
    return fetchApi<{ taskItem: TaskItem }>(`/task-config/types/${input.taskTypeId}/items`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateTaskItem(id: number, input: UpdateTaskItemInput): Promise<{ taskItem: TaskItem }> {
    return fetchApi<{ taskItem: TaskItem }>(`/task-config/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteTaskItem(id: number): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/task-config/items/${id}`, {
      method: 'DELETE',
    });
  },
};

