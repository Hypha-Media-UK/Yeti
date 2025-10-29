import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { LRUCache } from '@/utils/lru-cache';
import type { DaySnapshot, ShiftAssignment, ManualAssignment } from '@shared/types/shift';

// Cache configuration
const CACHE_SIZE_LIMIT = 7; // Keep last 7 days in cache
const DEBUG = import.meta.env.DEV;

// Debug logging helper
function debug(message: string, ...args: any[]) {
  if (DEBUG) console.log(message, ...args);
}

// Helper: Get day of week (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay();
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
  const currentSnapshot = ref<DaySnapshot | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Cache: LRU cache of date string -> DaySnapshot
  const cache = new LRUCache<string, DaySnapshot>(CACHE_SIZE_LIMIT);

  // Track ongoing prefetch operations to avoid duplicates
  const prefetchInProgress = ref<Set<string>>(new Set());

  // Computed properties
  const dayShifts = computed(() => currentSnapshot.value?.rota.dayShifts || []);
  const nightShifts = computed(() => currentSnapshot.value?.rota.nightShifts || []);
  const areas = computed(() => currentSnapshot.value?.areas || []);
  
  const allShiftsForDate = computed(() => {
    if (!currentSnapshot.value) return [];
    return [
      ...currentSnapshot.value.rota.dayShifts,
      ...currentSnapshot.value.rota.nightShifts
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
   * Get a snapshot from cache
   */
  function getCached(date: string): DaySnapshot | undefined {
    return cache.get(date);
  }

  /**
   * Store a snapshot in cache
   */
  function setCached(date: string, snapshot: DaySnapshot): void {
    cache.set(date, snapshot);
    debug(`[CACHE] Stored snapshot for ${date}`);
  }

  /**
   * Check if a date is cached
   */
  function isCached(date: string): boolean {
    return cache.has(date);
  }

  /**
   * Clear cache for specific dates (used for invalidation)
   */
  function clearCache(dates?: string[]): void {
    if (dates) {
      dates.forEach(date => cache.delete(date));
      debug(`[CACHE] Cleared ${dates.length} dates`);
    } else {
      cache.clear();
      debug('[CACHE] Cleared all');
    }
  }

  /**
   * Fetch a complete day snapshot from API (rota + areas)
   */
  async function fetchSnapshot(date: string): Promise<DaySnapshot> {
    debug(`[API] Fetching snapshot for ${date}`);
    
    const dayOfWeek = getDayOfWeek(date);

    // Fetch rota and areas in parallel
    const [rota, areasResponse] = await Promise.all([
      api.getRotaForDay(date),
      api.getMainRotaAreasForDay(dayOfWeek, date, false)
    ]);

    // Load staff for each area in parallel
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

    const snapshot: DaySnapshot = {
      date,
      rota,
      areas: areasWithStaff,
      loadedAt: Date.now()
    };

    debug(`[API] Fetched snapshot for ${date}:`, {
      dayShifts: rota.dayShifts.length,
      nightShifts: rota.nightShifts.length,
      areas: areasWithStaff.length
    });

    return snapshot;
  }

  // ============================================================================
  // ORCHESTRATION (With side effects - state updates, caching)
  // ============================================================================

  /**
   * Load a day's data (checks cache first, then fetches if needed)
   */
  async function loadDay(date: string, options: { skipCache?: boolean; silent?: boolean } = {}) {
    const { skipCache = false, silent = false } = options;

    // Update loading state (unless silent)
    if (!silent) {
      isLoading.value = true;
      error.value = null;
    }

    try {
      // Check cache first
      if (!skipCache && isCached(date)) {
        const snapshot = getCached(date)!;
        currentSnapshot.value = snapshot;
        selectedDate.value = date;
        debug(`[CACHE HIT] Using cached snapshot for ${date}`);
        return;
      }

      // Cache miss - fetch from API
      debug(`[CACHE MISS] Fetching snapshot for ${date} from API`);
      const snapshot = await fetchSnapshot(date);
      
      // Update state and cache
      currentSnapshot.value = snapshot;
      selectedDate.value = date;
      setCached(date, snapshot);

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
   * Prefetch adjacent days in the background
   */
  async function prefetchAdjacentDays(date: string): Promise<void> {
    const previousDate = addDays(date, -1);
    const nextDate = addDays(date, 1);
    const datesToPrefetch = [previousDate, nextDate];

    debug(`[PREFETCH] Starting prefetch for adjacent days of ${date}`);

    // Filter out dates that are already cached or being prefetched
    const datesToFetch = datesToPrefetch.filter(d => {
      if (isCached(d)) {
        debug(`[PREFETCH] Skipping ${d} (already cached)`);
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

    // Fetch in parallel (silent mode - no loading indicators)
    await Promise.all(
      datesToFetch.map(async (d) => {
        try {
          await loadDay(d, { silent: true });
          debug(`[PREFETCH] Successfully prefetched ${d}`);
        } catch (err) {
          debug(`[PREFETCH] Failed to prefetch ${d}:`, err);
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
    
    // Invalidate cache for the affected date
    clearCache([assignment.assignmentDate]);
    
    // Reload current day if it's the affected date
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
    
    // Invalidate cache for the affected date
    clearCache([affectedDate]);
    
    // Reload current day if it's the affected date
    if (selectedDate.value === affectedDate) {
      await loadDay(affectedDate, { skipCache: true });
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  function getCacheStats() {
    return cache.getStats();
  }

  return {
    // State
    selectedDate,
    currentSnapshot,
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
    clearCache,
    getCacheStats,
    
    // Utilities (exposed for testing)
    isCached,
  };
});

