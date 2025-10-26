import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { DayRota, ShiftAssignment, ManualAssignment } from '@shared/types/shift';

export const useRotaStore = defineStore('rota', () => {
  const selectedDate = ref<string>('');
  const currentDayRota = ref<DayRota | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const dayShifts = computed(() => currentDayRota.value?.dayShifts || []);
  const nightShifts = computed(() => currentDayRota.value?.nightShifts || []);
  
  const allShiftsForDate = computed(() => {
    if (!currentDayRota.value) return [];
    return [...currentDayRota.value.dayShifts, ...currentDayRota.value.nightShifts].sort((a, b) => {
      // Sort by shift type first (Day before Night), then by name
      if (a.shiftType !== b.shiftType) {
        return a.shiftType === 'Day' ? -1 : 1;
      }
      const nameA = `${a.staff.lastName} ${a.staff.firstName}`;
      const nameB = `${b.staff.lastName} ${b.staff.firstName}`;
      return nameA.localeCompare(nameB);
    });
  });

  function setSelectedDate(date: string) {
    selectedDate.value = date;
  }

  async function fetchRotaForDate(date: string) {
    isLoading.value = true;
    error.value = null;
    selectedDate.value = date;

    try {
      const rota = await api.getRotaForDay(date);
      currentDayRota.value = rota;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch rota';
      console.error('Error fetching rota:', err);
      currentDayRota.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchRotaForRange(startDate: string, endDate: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.getRotaForRange(startDate, endDate);
      return response.days;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch rota range';
      console.error('Error fetching rota range:', err);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function createAssignment(assignment: Omit<ManualAssignment, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;

    try {
      await api.createAssignment(assignment);
      // Refresh the current rota if it's for the same date
      if (selectedDate.value === assignment.assignmentDate) {
        await fetchRotaForDate(selectedDate.value);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create assignment';
      console.error('Error creating assignment:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteAssignment(id: number, assignmentDate: string) {
    isLoading.value = true;
    error.value = null;

    try {
      await api.deleteAssignment(id);
      // Refresh the current rota if it's for the same date
      if (selectedDate.value === assignmentDate) {
        await fetchRotaForDate(selectedDate.value);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete assignment';
      console.error('Error deleting assignment:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    selectedDate,
    currentDayRota,
    isLoading,
    error,
    dayShifts,
    nightShifts,
    allShiftsForDate,
    setSelectedDate,
    fetchRotaForDate,
    fetchRotaForRange,
    createAssignment,
    deleteAssignment,
  };
});

