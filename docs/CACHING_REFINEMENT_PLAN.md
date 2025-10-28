# Caching Architecture Refinement Plan

## Executive Summary

After implementing the store-based caching solution, this document analyzes what could be improved and proposes a refined, minimal, and more functional architecture.

---

## Current Implementation Analysis

### What Works Well ✅

1. **Store-based ownership** - Cache lives in Pinia store, not component
2. **Silent prefetch** - Background loading doesn't trigger UI indicators
3. **Cache invalidation** - Clears on mutations
4. **Performance** - Instant navigation to adjacent days

### What Could Be Better 🔧

1. **Duplication** - Areas are loaded separately, not cached
2. **Complexity** - `setTimeout(..., 0)` is a workaround, not a solution
3. **Coupling** - Prefetch logic tightly coupled to fetch logic
4. **Configuration** - Constants at module level, not configurable
5. **LRU Implementation** - Naive (removes oldest by insertion order, not access order)
6. **Console Logging** - Too verbose, should be debug-only
7. **Error Handling** - Prefetch errors are logged but not surfaced
8. **Type Safety** - Options object could be more explicit

---

## Architectural Issues

### Issue 1: Areas Not Cached

**Current State:**
- Rota data is cached in store
- Areas data is loaded separately in component
- No caching for areas = duplicate API calls

**Impact:**
- When navigating between days, areas are re-fetched every time
- Inconsistent caching strategy

**Solution:**
- Cache areas in the same store
- Prefetch areas alongside rota data
- Single source of truth for all day data

### Issue 2: Prefetch Timing Hack

**Current State:**
```typescript
setTimeout(() => prefetchAdjacentDays(date), 0);
```

**Why This Is Bad:**
- `setTimeout(..., 0)` is a hack to defer execution
- Relies on event loop timing
- Not explicit about intent
- Could cause race conditions

**Better Solution:**
- Use explicit async/await flow
- Separate "load current" from "prefetch adjacent"
- Make prefetch a side effect, not inline

### Issue 3: Tight Coupling

**Current State:**
- `fetchRotaForDate()` calls `prefetchAdjacentDays()` internally
- Prefetch logic embedded in fetch logic
- Hard to test, hard to disable

**Better Solution:**
- Separate concerns: fetch vs prefetch
- Component decides when to prefetch
- Store provides primitives, component orchestrates

### Issue 4: Naive LRU

**Current State:**
```typescript
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
- Removes oldest by **insertion order**, not **access order**
- If user navigates: Day 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
- Day 1 is evicted even though Day 2-7 might never be accessed again
- True LRU should evict **least recently accessed**, not oldest inserted

**Better Solution:**
- Track access time on cache hits
- Evict based on last access time
- Or use a proper LRU library

---

## Proposed Refined Architecture

### Design Principles

1. **Separation of Concerns** - Store provides primitives, component orchestrates
2. **Explicit Over Implicit** - No hidden side effects
3. **Composability** - Small, focused functions
4. **Type Safety** - Explicit types, no `any`
5. **Testability** - Pure functions where possible
6. **Performance** - Minimize API calls, maximize cache hits

### Core Concepts

#### 1. Unified Day Data Cache

Instead of caching rota and areas separately, cache a complete "day snapshot":

```typescript
interface DaySnapshot {
  date: string;
  rota: DayRota;
  areas: AreaWithHours[];
  loadedAt: number; // timestamp for LRU
}
```

**Benefits:**
- Single cache for all day data
- Atomic updates (rota + areas together)
- Simpler invalidation logic

#### 2. Explicit Prefetch Strategy

Instead of automatic prefetch on every fetch, make it explicit:

```typescript
// Component decides when to prefetch
async function loadDay(date: string) {
  await store.fetchDay(date);
  // Explicit prefetch after load completes
  store.prefetchAdjacentDays(date);
}
```

**Benefits:**
- Clear intent
- No hidden side effects
- Easy to disable/modify
- Testable

#### 3. Proper LRU Cache

Use a proper LRU implementation:

```typescript
class LRUCache<K, V> {
  private cache: Map<K, { value: V; lastAccess: number }>;
  private maxSize: number;

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccess = Date.now(); // Update access time
      return entry.value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    this.cache.set(key, { value, lastAccess: Date.now() });
    this.evictIfNeeded();
  }

  private evictIfNeeded(): void {
    if (this.cache.size > this.maxSize) {
      // Find least recently accessed
      let oldestKey: K | null = null;
      let oldestTime = Infinity;
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccess < oldestTime) {
          oldestTime = entry.lastAccess;
          oldestKey = key;
        }
      }
      
      if (oldestKey) this.cache.delete(oldestKey);
    }
  }
}
```

#### 4. Composable Store API

```typescript
// Primitives (no side effects)
fetchDay(date: string): Promise<DaySnapshot>
getCachedDay(date: string): DaySnapshot | undefined
setCachedDay(date: string, snapshot: DaySnapshot): void
clearCache(): void
clearCacheForDate(date: string): void

// Orchestration (with side effects)
loadDay(date: string, options?: { skipCache?: boolean }): Promise<void>
prefetchAdjacentDays(date: string): Promise<void>
```

---

## Implementation Plan

### Phase 1: Unified Day Snapshot (2 hours)

**Goal:** Cache rota + areas together

**Steps:**
1. Create `DaySnapshot` type
2. Update store to cache `DaySnapshot` instead of just `DayRota`
3. Update `fetchDay()` to fetch both rota and areas
4. Update component to use unified cache

**Files:**
- `frontend/src/stores/rota.ts`
- `frontend/src/views/DayView.vue`

### Phase 2: Proper LRU Cache (1 hour)

**Goal:** Implement true LRU eviction

**Steps:**
1. Create `LRUCache` class
2. Replace `Map` with `LRUCache` in store
3. Update access patterns to track last access time
4. Test eviction logic

**Files:**
- `frontend/src/utils/lru-cache.ts` (new)
- `frontend/src/stores/rota.ts`

### Phase 3: Explicit Prefetch (1 hour)

**Goal:** Remove automatic prefetch, make it explicit

**Steps:**
1. Remove `setTimeout()` hack from `fetchDay()`
2. Make `prefetchAdjacentDays()` a separate action
3. Update component to call prefetch explicitly
4. Add configuration for prefetch behavior

**Files:**
- `frontend/src/stores/rota.ts`
- `frontend/src/views/DayView.vue`

### Phase 4: Clean Up & Polish (1 hour)

**Goal:** Remove cruft, improve DX

**Steps:**
1. Remove excessive console logging (use debug flag)
2. Add proper TypeScript types
3. Add JSDoc comments
4. Write unit tests for cache logic
5. Update documentation

**Files:**
- `frontend/src/stores/rota.ts`
- `frontend/src/utils/lru-cache.ts`
- `frontend/tests/unit/lru-cache.spec.ts` (new)

---

## Expected Outcomes

### Performance
- ✅ Same instant navigation (0ms for cached days)
- ✅ Fewer API calls (areas cached too)
- ✅ Better cache hit rate (true LRU)

### Code Quality
- ✅ Simpler, more readable code
- ✅ Better separation of concerns
- ✅ More testable
- ✅ Type-safe

### Maintainability
- ✅ Easier to understand
- ✅ Easier to modify
- ✅ Easier to debug
- ✅ Self-documenting

---

## Alternative Approaches Considered

### Option A: Use a Library (e.g., `lru-cache`)

**Pros:**
- Battle-tested
- Feature-rich
- Well-documented

**Cons:**
- Additional dependency
- Overkill for our use case
- Adds bundle size

**Decision:** Build our own minimal LRU (50 lines vs 1000+ lines)

### Option B: Service Worker Cache

**Pros:**
- Browser-native caching
- Works offline
- Persistent across sessions

**Cons:**
- Complex setup
- Overkill for our use case
- Harder to invalidate

**Decision:** Stick with in-memory cache (simpler, sufficient)

### Option C: React Query / TanStack Query

**Pros:**
- Handles caching, prefetching, invalidation
- Industry standard
- Well-tested

**Cons:**
- We're using Vue, not React
- Would require major refactor
- Overkill for our simple use case

**Decision:** Keep our custom solution (fits our needs perfectly)

---

## Success Metrics

### Before Refinement
- ✅ Instant navigation to adjacent days
- ❌ Areas re-fetched every time
- ❌ Naive LRU (insertion order)
- ❌ Tight coupling (fetch + prefetch)
- ❌ Verbose logging

### After Refinement
- ✅ Instant navigation to adjacent days
- ✅ Areas cached (no re-fetch)
- ✅ True LRU (access order)
- ✅ Loose coupling (composable)
- ✅ Clean, minimal logging

---

## Next Steps

1. **Review this plan** with the team
2. **Get approval** for the refinement
3. **Implement Phase 1** (unified snapshot)
4. **Test thoroughly** before moving to Phase 2
5. **Iterate** based on feedback

---

*Document created: 2025-10-28*
*Author: AI Assistant*
*Status: DRAFT - Awaiting Review*

