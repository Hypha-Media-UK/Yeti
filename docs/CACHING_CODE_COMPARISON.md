# Caching Implementation: Before vs After

## Overview

This document shows side-by-side comparisons of the current implementation vs the proposed refined implementation.

---

## 1. Store Structure

### Current Implementation (230 lines)

```typescript
// frontend/src/stores/rota.ts
export const useRotaStore = defineStore('rota', () => {
  // State
  const selectedDate = ref<string>('');
  const currentDayRota = ref<DayRota | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const rotaCache = ref<Map<string, DayRota>>(new Map());
  const prefetchInProgress = ref<Set<string>>(new Set());

  // Computed
  const dayShifts = computed(() => currentDayRota.value?.dayShifts || []);
  const nightShifts = computed(() => currentDayRota.value?.nightShifts || []);

  // Fetch with automatic prefetch
  async function fetchRotaForDate(date: string, options = {}) {
    const { skipCache = false, silent = false } = options;
    
    if (!skipCache && rotaCache.value.has(date)) {
      currentDayRota.value = rotaCache.value.get(date)!;
      selectedDate.value = date;
      
      // HACK: setTimeout to defer prefetch
      if (PREFETCH_ENABLED && !silent) {
        setTimeout(() => prefetchAdjacentDays(date), 0);
      }
      return;
    }

    // Fetch from API...
    const rota = await api.getRotaForDay(date);
    currentDayRota.value = rota;
    rotaCache.value.set(date, rota);
    
    // HACK: setTimeout to defer prefetch
    if (PREFETCH_ENABLED && !silent) {
      setTimeout(() => prefetchAdjacentDays(date), 0);
    }
  }

  // Prefetch with duplicate checks
  async function prefetchAdjacentDays(currentDate: string) {
    const previousDate = addDays(currentDate, -1);
    const nextDate = addDays(currentDate, 1);

    if (!rotaCache.value.has(previousDate) && !prefetchInProgress.value.has(previousDate)) {
      prefetchInProgress.value.add(previousDate);
      try {
        await fetchRotaForDate(previousDate, { silent: true });
      } finally {
        prefetchInProgress.value.delete(previousDate);
      }
    }

    // Same for next day...
  }
});
```

**Issues:**
- ❌ Rota and areas cached separately
- ❌ `setTimeout(..., 0)` hack
- ❌ Prefetch tightly coupled to fetch
- ❌ Naive LRU (insertion order)
- ❌ Verbose logging

### Proposed Refined Implementation (~150 lines)

```typescript
// frontend/src/stores/day.ts
import { LRUCache } from '@/utils/lru-cache';

interface DaySnapshot {
  date: string;
  rota: DayRota;
  areas: AreaWithHours[];
}

export const useDayStore = defineStore('day', () => {
  // State
  const currentDate = ref<string>('');
  const currentSnapshot = ref<DaySnapshot | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // True LRU cache
  const cache = new LRUCache<string, DaySnapshot>(7);
  const prefetchQueue = ref<Set<string>>(new Set());

  // Computed
  const dayShifts = computed(() => currentSnapshot.value?.rota.dayShifts || []);
  const nightShifts = computed(() => currentSnapshot.value?.rota.nightShifts || []);
  const areas = computed(() => currentSnapshot.value?.areas || []);

  // Primitives (no side effects)
  function getCached(date: string): DaySnapshot | undefined {
    return cache.get(date);
  }

  function setCached(date: string, snapshot: DaySnapshot): void {
    cache.set(date, snapshot);
  }

  async function fetchSnapshot(date: string): Promise<DaySnapshot> {
    const [rota, areasData] = await Promise.all([
      api.getRotaForDay(date),
      api.getMainRotaAreasForDay(getDayOfWeek(date), date, true)
    ]);
    
    return { date, rota, areas: areasData.areas };
  }

  // Orchestration (with side effects)
  async function loadDay(date: string, options: { skipCache?: boolean } = {}) {
    // Check cache first
    if (!options.skipCache) {
      const cached = getCached(date);
      if (cached) {
        currentSnapshot.value = cached;
        currentDate.value = date;
        return;
      }
    }

    // Fetch from API
    isLoading.value = true;
    error.value = null;
    
    try {
      const snapshot = await fetchSnapshot(date);
      currentSnapshot.value = snapshot;
      currentDate.value = date;
      setCached(date, snapshot);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load day';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Explicit prefetch (no automatic triggering)
  async function prefetchAdjacentDays(date: string): Promise<void> {
    const dates = [addDays(date, -1), addDays(date, 1)];
    
    const promises = dates
      .filter(d => !getCached(d) && !prefetchQueue.value.has(d))
      .map(async (d) => {
        prefetchQueue.value.add(d);
        try {
          const snapshot = await fetchSnapshot(d);
          setCached(d, snapshot);
        } catch (err) {
          console.warn(`Prefetch failed for ${d}:`, err);
        } finally {
          prefetchQueue.value.delete(d);
        }
      });

    await Promise.all(promises);
  }

  // Mutations
  async function invalidateDate(date: string): Promise<void> {
    cache.delete(date);
    if (currentDate.value === date) {
      await loadDay(date, { skipCache: true });
    }
  }

  return {
    // State
    currentDate,
    currentSnapshot,
    isLoading,
    error,
    
    // Computed
    dayShifts,
    nightShifts,
    areas,
    
    // Actions
    loadDay,
    prefetchAdjacentDays,
    invalidateDate,
    clearCache: () => cache.clear(),
  };
});
```

**Benefits:**
- ✅ Unified snapshot (rota + areas)
- ✅ No setTimeout hacks
- ✅ Explicit prefetch
- ✅ True LRU cache
- ✅ Cleaner, more testable

---

## 2. Component Usage

### Current Implementation

```typescript
// frontend/src/views/DayView.vue
const rotaStore = useRotaStore();
const selectedDate = ref<string>(getTodayString());
const areas = ref<any[]>([]); // Separate state!

// Watch for date changes
watch(selectedDate, (newDate) => {
  router.push({ name: 'day', params: { date: newDate } });
  loadRota();   // Load rota
  loadAreas();  // Load areas separately
});

async function loadRota() {
  await rotaStore.fetchRotaForDate(selectedDate.value);
  // Prefetch happens automatically inside fetchRotaForDate
}

async function loadAreas() {
  // No caching! Re-fetches every time
  const dayOfWeek = getDayOfWeek(selectedDate.value);
  const response = await api.getMainRotaAreasForDay(dayOfWeek, selectedDate.value, false);
  areas.value = response.areas;
  
  // Load staff for each area
  const staffLoadPromises = areas.value.map(area => loadAreaStaff(area));
  await Promise.all(staffLoadPromises);
}
```

**Issues:**
- ❌ Rota and areas loaded separately
- ❌ Areas not cached
- ❌ Prefetch hidden inside store
- ❌ Duplicate state management

### Proposed Refined Implementation

```typescript
// frontend/src/views/DayView.vue
const dayStore = useDayStore();

// Watch for date changes
watch(
  () => route.params.date,
  async (newDate) => {
    if (newDate && typeof newDate === 'string') {
      await dayStore.loadDay(newDate);
      // Explicit prefetch after load
      dayStore.prefetchAdjacentDays(newDate);
    }
  },
  { immediate: true }
);

// That's it! No separate loadRota/loadAreas
// Everything comes from the store:
const dayShifts = computed(() => dayStore.dayShifts);
const nightShifts = computed(() => dayStore.nightShifts);
const areas = computed(() => dayStore.areas);
```

**Benefits:**
- ✅ Single load function
- ✅ Everything cached
- ✅ Explicit prefetch
- ✅ Simpler component

---

## 3. LRU Cache Implementation

### Current Implementation (Naive)

```typescript
// Removes oldest by insertion order, not access order
function enforceCacheLimit() {
  if (rotaCache.value.size > CACHE_SIZE_LIMIT) {
    const entriesToRemove = rotaCache.value.size - CACHE_SIZE_LIMIT;
    const keys = Array.from(rotaCache.value.keys());
    for (let i = 0; i < entriesToRemove; i++) {
      rotaCache.value.delete(keys[i]);
    }
  }
}
```

**Problem:**
```
User navigates: Day 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
Cache (size 7): [1, 2, 3, 4, 5, 6, 7]
Day 8 added → Day 1 evicted (even though Day 2-7 might never be accessed again)
```

### Proposed Implementation (True LRU)

```typescript
// frontend/src/utils/lru-cache.ts
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccess = Date.now(); // Update access time
      return entry.value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      lastAccess: Date.now(),
    });
    this.evictIfNeeded();
  }

  private evictIfNeeded(): void {
    if (this.cache.size > this.maxSize) {
      let lruKey: K | null = null;
      let lruTime = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccess < lruTime) {
          lruTime = entry.lastAccess;
          lruKey = key;
        }
      }

      if (lruKey) this.cache.delete(lruKey);
    }
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

interface CacheEntry<V> {
  value: V;
  lastAccess: number;
}
```

**Benefit:**
```
User navigates: Day 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
User goes back: Day 7 (cache hit, updates lastAccess)
Cache evicts: Day 1 (truly least recently accessed)
```

---

## Summary

| Aspect | Current | Refined | Improvement |
|--------|---------|---------|-------------|
| **Lines of Code** | 230 (store) + 100 (component) | 150 (store) + 30 (component) | -45% |
| **Cache Strategy** | Separate (rota only) | Unified (rota + areas) | Better |
| **LRU** | Naive (insertion order) | True (access order) | Better |
| **Prefetch** | Automatic (hidden) | Explicit (clear) | Better |
| **Coupling** | Tight (fetch + prefetch) | Loose (composable) | Better |
| **Testability** | Hard (side effects) | Easy (pure functions) | Better |
| **Type Safety** | Partial | Full | Better |

---

*Document created: 2025-10-28*
*Author: AI Assistant*

