import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/services/api';

export const useConfigStore = defineStore('config', () => {
  const appZeroDate = ref<string>('');
  const timeZone = ref<string>('Europe/London');
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchConfig() {
    isLoading.value = true;
    error.value = null;

    try {
      const config = await api.getConfig();
      appZeroDate.value = config.appZeroDate;
      timeZone.value = config.timeZone;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch configuration';
      console.error('Error fetching config:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function updateZeroDate(newDate: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const config = await api.updateZeroDate(newDate);
      appZeroDate.value = config.appZeroDate;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update zero date';
      console.error('Error updating zero date:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    appZeroDate,
    timeZone,
    isLoading,
    error,
    fetchConfig,
    updateZeroDate,
  };
});

