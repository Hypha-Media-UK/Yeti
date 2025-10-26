import type { AppConfig } from '@shared/types/config';
import type { StaffMember, FixedSchedule } from '@shared/types/staff';
import type { DayRota, ManualAssignment } from '@shared/types/shift';

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
  async getAllStaff(filters?: { status?: string; group?: string }): Promise<{ staff: StaffMember[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.group) params.append('group', filters.group);
    
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
};

