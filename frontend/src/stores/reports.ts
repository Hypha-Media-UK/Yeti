import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api';
import type { TaskReportsData, StaffTaskStats, DepartmentTaskStats } from '@shared/types/reports';

export const useReportsStore = defineStore('reports', () => {
  // State
  const staffStats = ref<StaffTaskStats[]>([]);
  const departmentStats = ref<DepartmentTaskStats[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  async function fetchReportsData(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await api.getReportsData();
      staffStats.value = data.staffStats;
      departmentStats.value = data.departmentStats;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch reports data';
      console.error('Error fetching reports data:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    staffStats,
    departmentStats,
    loading,
    error,

    // Actions
    fetchReportsData,
  };
});

