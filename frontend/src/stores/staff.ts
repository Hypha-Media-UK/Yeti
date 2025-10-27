import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { StaffMember } from '@shared/types/staff';

export const useStaffStore = defineStore('staff', () => {
  const staffList = ref<StaffMember[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const activeStaff = computed(() => staffList.value.filter(s => s.isActive));

  function staffByStatus(status: string) {
    return activeStaff.value.filter(s => s.status === status);
  }

  async function fetchAllStaff(filters?: { status?: string }) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.getAllStaff(filters);
      staffList.value = response.staff;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch staff';
      console.error('Error fetching staff:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchStaffById(id: number) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.getStaffById(id);
      return response.staff;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch staff member';
      console.error('Error fetching staff member:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function createStaff(staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.createStaff(staff);
      staffList.value.push(response.staff);
      return response.staff;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create staff member';
      console.error('Error creating staff:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateStaff(id: number, updates: Partial<StaffMember>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.updateStaff(id, updates);
      const index = staffList.value.findIndex(s => s.id === id);
      if (index !== -1) {
        staffList.value[index] = response.staff;
      }
      return response.staff;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update staff member';
      console.error('Error updating staff:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteStaff(id: number) {
    isLoading.value = true;
    error.value = null;

    try {
      await api.deleteStaff(id);
      const index = staffList.value.findIndex(s => s.id === id);
      if (index !== -1) {
        staffList.value.splice(index, 1);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete staff member';
      console.error('Error deleting staff:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    staffList,
    isLoading,
    error,
    activeStaff,
    staffByStatus,
    fetchAllStaff,
    fetchStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
  };
});

