import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { DayRota, ShiftAssignment, ManualAssignment } from '@shared/types/shift';

// Cache configuration
const CACHE_SIZE_LIMIT = 7; // Keep last 7 days in cache
const PREFETCH_ENABLED = true; // Enable/disable prefetching

export const useRotaStore = defineStore('rota', () => {
  const selectedDate = ref<string>('');
  const currentDayRota = ref<DayRota | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Cache: Map of date string -> DayRota
  const rotaCache = ref<Map<string, DayRota>>(new Map());

  // Track ongoing prefetch operations to avoid duplicates
  const prefetchInProgress = ref<Set<string>>(new Set());

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

  // Helper: Add days to a date string
  function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // Helper: Enforce cache size limit (LRU - remove oldest entries)
  function enforceCacheLimit() {
    if (rotaCache.value.size > CACHE_SIZE_LIMIT) {
      const entriesToRemove = rotaCache.value.size - CACHE_SIZE_LIMIT;
      const keys = Array.from(rotaCache.value.keys());
      for (let i = 0; i < entriesToRemove; i++) {
        rotaCache.value.delete(keys[i]);
      }
    }
  }

  function setSelectedDate(date: string) {
    selectedDate.value = date;
  }

  // Clear the entire cache (e.g., after data mutations)
  function clearCache() {
    rotaCache.value.clear();
    console.log('[CACHE] Cleared all cached rota data');
  }

  // Clear specific date from cache
  function clearCacheForDate(date: string) {
    rotaCache.value.delete(date);
    console.log(`[CACHE] Cleared cache for ${date}`);
  }

  // Fetch rota for a date with caching support
  async function fetchRotaForDate(date: string, options: { skipCache?: boolean; silent?: boolean } = {}) {
    const { skipCache = false, silent = false } = options;

    // Check cache first (unless skipCache is true)
    if (!skipCache && rotaCache.value.has(date)) {
      console.log(`[CACHE HIT] Using cached rota for ${date}`);
      currentDayRota.value = rotaCache.value.get(date)!;
      selectedDate.value = date;

      // Trigger prefetch in background
      if (PREFETCH_ENABLED && !silent) {
        setTimeout(() => prefetchAdjacentDays(date), 0);
      }

      return;
    }

    // Cache miss - fetch from API
    if (!silent) {
      isLoading.value = true;
    }
    error.value = null;
    selectedDate.value = date;

    try {
      console.log(`[CACHE MISS] Fetching rota for ${date} from API`);
      const rota = await api.getRotaForDay(date);
      currentDayRota.value = rota;

      // Store in cache
      rotaCache.value.set(date, rota);
      enforceCacheLimit();

      // Trigger prefetch in background
      if (PREFETCH_ENABLED && !silent) {
        setTimeout(() => prefetchAdjacentDays(date), 0);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch rota';
      console.error('Error fetching rota:', err);
      currentDayRota.value = null;
    } finally {
      if (!silent) {
        isLoading.value = false;
      }
    }
  }

  // Prefetch adjacent days in the background
  async function prefetchAdjacentDays(currentDate: string) {
    const previousDate = addDays(currentDate, -1);
    const nextDate = addDays(currentDate, 1);

    // Prefetch previous day
    if (!rotaCache.value.has(previousDate) && !prefetchInProgress.value.has(previousDate)) {
      prefetchInProgress.value.add(previousDate);
      console.log(`[PREFETCH] Loading previous day: ${previousDate}`);
      try {
        await fetchRotaForDate(previousDate, { silent: true });
        console.log(`[PREFETCH] Cached rota for ${previousDate}`);
      } catch (err) {
        console.error(`[PREFETCH] Failed to load ${previousDate}:`, err);
      } finally {
        prefetchInProgress.value.delete(previousDate);
      }
    }

    // Prefetch next day
    if (!rotaCache.value.has(nextDate) && !prefetchInProgress.value.has(nextDate)) {
      prefetchInProgress.value.add(nextDate);
      console.log(`[PREFETCH] Loading next day: ${nextDate}`);
      try {
        await fetchRotaForDate(nextDate, { silent: true });
        console.log(`[PREFETCH] Cached rota for ${nextDate}`);
      } catch (err) {
        console.error(`[PREFETCH] Failed to load ${nextDate}:`, err);
      } finally {
        prefetchInProgress.value.delete(nextDate);
      }
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
      // Clear cache for the affected date and refresh
      clearCacheForDate(assignment.assignmentDate);
      if (selectedDate.value === assignment.assignmentDate) {
        await fetchRotaForDate(selectedDate.value, { skipCache: true });
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
      // Clear cache for the affected date and refresh
      clearCacheForDate(assignmentDate);
      if (selectedDate.value === assignmentDate) {
        await fetchRotaForDate(selectedDate.value, { skipCache: true });
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
    clearCache,
    clearCacheForDate,
    prefetchAdjacentDays,
  };
});

