import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { LRUCache } from '@/utils/lru-cache';
import type { DayRota, ShiftAssignment, ManualAssignment } from '@shared/types/shift';

// Cache configuration
const CACHE_SIZE_LIMIT = 7; // Keep last 7 days in cache
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

// Helper: Add days to a date string
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export const useDayStore = defineStore('day', () => {
  // State
  const selectedDate = ref<string>('');
  const currentRota = ref<DayRota | null>(null);
  const currentAreas = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Cache: LRU cache of date string -> DayRota (only rota, not area staff)
  const rotaCache = new LRUCache<string, DayRota>(CACHE_SIZE_LIMIT);

  // Track ongoing prefetch operations to avoid duplicates
  const prefetchInProgress = ref<Set<string>>(new Set());

  // Computed properties
  const dayShifts = computed(() => currentRota.value?.dayShifts || []);
  const nightShifts = computed(() => currentRota.value?.nightShifts || []);
  const areas = computed(() => currentAreas.value || []);
  
  const allShiftsForDate = computed(() => {
    if (!currentRota.value) return [];
    return [
      ...currentRota.value.dayShifts,
      ...currentRota.value.nightShifts
    ].sort((a, b) => {
      // Sort by shift type first (Day before Night), then by name
      if (a.shiftType !== b.shiftType) {
        return a.shiftType === 'Day' ? -1 : 1;
      }
      const nameA = `${a.staff.lastName} ${a.staff.firstName}`;
      const nameB = `${b.staff.lastName} ${b.staff.firstName}`;
      return nameA.localeCompare(nameB);
    });
  });

  // ============================================================================
  // PRIMITIVES (No side effects - pure functions)
  // ============================================================================

  /**
   * Get rota from cache
   */
  function getCachedRota(date: string): DayRota | undefined {
    return rotaCache.get(date);
  }

  /**
   * Store rota in cache
   */
  function setCachedRota(date: string, rota: DayRota): void {
    rotaCache.set(date, rota);
    debug(`[CACHE] Stored rota for ${date}`);
  }

  /**
   * Check if rota is cached
   */
  function isRotaCached(date: string): boolean {
    return rotaCache.has(date);
  }

  /**
   * Clear rota cache for specific dates
   */
  function clearRotaCache(dates?: string[]): void {
    if (dates) {
      dates.forEach(date => rotaCache.delete(date));
      debug(`[CACHE] Cleared rota for ${dates.length} dates`);
    } else {
      rotaCache.clear();
      debug('[CACHE] Cleared all rota');
    }
  }

  /**
   * Fetch rota from API (cached)
   */
  async function fetchRota(date: string): Promise<DayRota> {
    debug(`[API] Fetching rota for ${date}`);
    const rota = await api.getRotaForDay(date);
    debug(`[API] Fetched rota for ${date}:`, {
      dayShifts: rota.dayShifts.length,
      nightShifts: rota.nightShifts.length
    });
    return rota;
  }

  /**
   * Fetch areas and their staff from API (always fresh, never cached)
   */
  async function fetchAreasWithStaff(date: string): Promise<any[]> {
    debug(`[API] Fetching areas and staff for ${date}`);

    const dayOfWeek = getDayOfWeek(date);

    // Fetch areas list
    const areasResponse = await api.getMainRotaAreasForDay(dayOfWeek, date, false);

    // Load staff for each area in parallel (always fresh)
    const areasWithStaff = await Promise.all(
      areasResponse.areas.map(async (area: any) => {
        try {
          const staffResponse = await api.getAreaStaff(area.type, area.id, date);
          return { ...area, staff: staffResponse.staff };
        } catch (err) {
          console.error(`Error loading staff for ${area.name}:`, err);
          return { ...area, staff: [] };
        }
      })
    );

    debug(`[API] Fetched areas for ${date}:`, {
      areas: areasWithStaff.length
    });

    return areasWithStaff;
  }

  // ============================================================================
  // ORCHESTRATION (With side effects - state updates, caching)
  // ============================================================================

  /**
   * Load a day's data (rota cached, areas always fresh)
   */
  async function loadDay(date: string, options: { skipCache?: boolean; silent?: boolean } = {}) {
    const { skipCache = false, silent = false } = options;

    // Update loading state (unless silent)
    if (!silent) {
      isLoading.value = true;
      error.value = null;
    }

    try {
      selectedDate.value = date;

      // Fetch rota (with cache)
      let rota: DayRota;
      if (!skipCache && isRotaCached(date)) {
        rota = getCachedRota(date)!;
        debug(`[CACHE HIT] Using cached rota for ${date}`);
      } else {
        debug(`[CACHE MISS] Fetching rota for ${date} from API`);
        rota = await fetchRota(date);
        setCachedRota(date, rota);
      }

      // Always fetch areas fresh (no caching)
      const areas = await fetchAreasWithStaff(date);

      // Update state
      currentRota.value = rota;
      currentAreas.value = areas;

    } catch (err: any) {
      error.value = err.message || 'Failed to load day data';
      console.error('Error loading day:', err);
      throw err;
    } finally {
      if (!silent) {
        isLoading.value = false;
      }
    }
  }

  /**
   * Prefetch adjacent days' rota in the background (areas not prefetched)
   */
  async function prefetchAdjacentDays(date: string): Promise<void> {
    const previousDate = addDays(date, -1);
    const nextDate = addDays(date, 1);
    const datesToPrefetch = [previousDate, nextDate];

    debug(`[PREFETCH] Starting prefetch for adjacent days of ${date}`);

    // Filter out dates that are already cached or being prefetched
    const datesToFetch = datesToPrefetch.filter(d => {
      if (isRotaCached(d)) {
        debug(`[PREFETCH] Skipping ${d} (rota already cached)`);
        return false;
      }
      if (prefetchInProgress.value.has(d)) {
        debug(`[PREFETCH] Skipping ${d} (already prefetching)`);
        return false;
      }
      return true;
    });

    if (datesToFetch.length === 0) {
      debug('[PREFETCH] No dates to prefetch');
      return;
    }

    // Mark as in progress
    datesToFetch.forEach(d => prefetchInProgress.value.add(d));

    // Prefetch rota only (silent mode - no loading indicators)
    await Promise.all(
      datesToFetch.map(async (d) => {
        try {
          const rota = await fetchRota(d);
          setCachedRota(d, rota);
          debug(`[PREFETCH] Successfully prefetched rota for ${d}`);
        } catch (err) {
          debug(`[PREFETCH] Failed to prefetch rota for ${d}:`, err);
        } finally {
          prefetchInProgress.value.delete(d);
        }
      })
    );

    debug('[PREFETCH] Completed');
  }

  /**
   * Create a manual assignment and invalidate affected cache
   */
  async function createAssignment(assignment: Omit<ManualAssignment, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await api.createAssignment(assignment);

    // Invalidate rota cache for the affected date
    clearRotaCache([assignment.assignmentDate]);

    // Reload current day if it's the affected date (will fetch fresh areas)
    if (selectedDate.value === assignment.assignmentDate) {
      await loadDay(assignment.assignmentDate, { skipCache: true });
    }

    return result;
  }

  /**
   * Delete a manual assignment and invalidate affected cache
   */
  async function deleteAssignment(id: number, affectedDate: string) {
    await api.deleteAssignment(id);

    // Invalidate rota cache for the affected date
    clearRotaCache([affectedDate]);

    // Reload current day if it's the affected date (will fetch fresh areas)
    if (selectedDate.value === affectedDate) {
      await loadDay(affectedDate, { skipCache: true });
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  function getCacheStats() {
    return rotaCache.getStats();
  }

  return {
    // State
    selectedDate,
    currentRota,
    currentAreas,
    isLoading,
    error,

    // Computed
    dayShifts,
    nightShifts,
    areas,
    allShiftsForDate,

    // Actions
    loadDay,
    prefetchAdjacentDays,
    createAssignment,
    deleteAssignment,
    clearRotaCache,
    getCacheStats,

    // Utilities (exposed for testing)
    isRotaCached,
  };
});

