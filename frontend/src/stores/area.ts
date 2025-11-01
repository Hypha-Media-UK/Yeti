import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { retry, formatErrorMessage } from '@/utils/retry';

const DEBUG = import.meta.env.DEV;

// Debug logging helper
function debug(message: string, ...args: any[]) {
  if (DEBUG) console.log(message, ...args);
}

// Helper: Get day of week (ISO 8601: Monday=1, Sunday=7)
function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  const jsDay = date.getDay(); // JavaScript: Sunday=0, Monday=1, ..., Saturday=6
  return jsDay === 0 ? 7 : jsDay; // Convert to ISO 8601: Monday=1, Sunday=7
}

export interface AreaWithStaff {
  id: number;
  name: string;
  type: 'department' | 'service';
  staff: any[];
}

export const useAreaStore = defineStore('area', () => {
  // State
  const currentDate = ref<string>('');
  const currentAreas = ref<AreaWithStaff[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const areas = computed(() => currentAreas.value);
  const areaCount = computed(() => currentAreas.value.length);
  const totalStaffInAreas = computed(() => 
    currentAreas.value.reduce((sum, area) => sum + area.staff.length, 0)
  );

  // ============================================================================
  // PRIMITIVES (No side effects - pure functions)
  // ============================================================================

  /**
   * Fetch areas and their staff from API with retry logic
   */
  async function fetchAreasWithStaff(date: string): Promise<AreaWithStaff[]> {
    debug(`[AREA API] Fetching areas and staff for ${date}`);

    const dayOfWeek = getDayOfWeek(date);

    try {
      // Fetch areas list with staff included (includeStaff=true)
      // This ensures isUnderstaffed is calculated correctly by the backend
      const areasResponse = await retry(
        () => api.getMainRotaAreasForDay(dayOfWeek, date, true),
        { maxAttempts: 3, delayMs: 1000 }
      );

      debug(`[AREA API] Fetched ${areasResponse.areas.length} areas for ${date}`);
      return areasResponse.areas;
    } catch (err) {
      console.error('[AREA API] Error fetching areas:', err);
      throw err;
    }
  }

  // ============================================================================
  // ORCHESTRATION (With side effects - state updates)
  // ============================================================================

  /**
   * Load areas for a specific date
   */
  async function loadAreas(date: string, options: { silent?: boolean } = {}) {
    const { silent = false } = options;

    if (!silent) {
      isLoading.value = true;
      error.value = null;
    }

    try {
      currentDate.value = date;
      const areas = await fetchAreasWithStaff(date);
      currentAreas.value = areas;
      
      debug(`[AREA STORE] Loaded ${areas.length} areas for ${date}`);
    } catch (err: any) {
      error.value = formatErrorMessage(err, 'Failed to load areas');
      console.error('[AREA STORE] Error loading areas:', err);
      throw err;
    } finally {
      if (!silent) {
        isLoading.value = false;
      }
    }
  }

  /**
   * Reload areas for current date
   */
  async function reloadAreas() {
    if (!currentDate.value) {
      console.warn('[AREA STORE] No current date set, cannot reload');
      return;
    }
    await loadAreas(currentDate.value);
  }

  /**
   * Clear area data
   */
  function clearAreas() {
    currentAreas.value = [];
    currentDate.value = '';
    error.value = null;
    debug('[AREA STORE] Cleared area data');
  }

  /**
   * Get area by ID
   */
  function getAreaById(id: number): AreaWithStaff | undefined {
    return currentAreas.value.find(area => area.id === id);
  }

  /**
   * Get areas by type
   */
  function getAreasByType(type: 'department' | 'service'): AreaWithStaff[] {
    return currentAreas.value.filter(area => area.type === type);
  }

  return {
    // State
    currentDate,
    currentAreas,
    isLoading,
    error,

    // Computed
    areas,
    areaCount,
    totalStaffInAreas,

    // Actions
    loadAreas,
    reloadAreas,
    clearAreas,
    getAreaById,
    getAreasByType,
  };
});

