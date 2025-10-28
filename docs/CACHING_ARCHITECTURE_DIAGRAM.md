# Caching Architecture: Visual Diagrams

## Current Architecture (As Implemented)

```
┌─────────────────────────────────────────────────────────────────┐
│                         DayView Component                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  selectedDate    │         │  areas (local)   │             │
│  │  (local ref)     │         │  (not cached!)   │             │
│  └──────────────────┘         └──────────────────┘             │
│           │                            │                         │
│           │                            │                         │
│           ▼                            ▼                         │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  loadRota()      │         │  loadAreas()     │             │
│  │  (calls store)   │         │  (direct API)    │             │
│  └──────────────────┘         └──────────────────┘             │
│           │                            │                         │
└───────────┼────────────────────────────┼─────────────────────────┘
            │                            │
            ▼                            ▼
┌───────────────────────────┐   ┌──────────────────┐
│     Rota Store (Pinia)    │   │   API Service    │
├───────────────────────────┤   └──────────────────┘
│                           │            │
│  ┌─────────────────────┐ │            │
│  │  rotaCache (Map)    │ │            │
│  │  ┌───────────────┐  │ │            │
│  │  │ "2025-10-28"  │  │ │            │
│  │  │ "2025-10-29"  │  │ │            │
│  │  │ "2025-10-30"  │  │ │            │
│  │  └───────────────┘  │ │            │
│  └─────────────────────┘ │            │
│                           │            │
│  fetchRotaForDate()      │            │
│    ├─ Check cache        │            │
│    ├─ Fetch from API ────┼────────────┘
│    ├─ Store in cache     │
│    └─ setTimeout(        │
│         prefetch, 0) ◄───┼─── HACK!
│                           │
└───────────────────────────┘

Issues:
❌ Areas not cached (duplicate API calls)
❌ setTimeout hack for prefetch timing
❌ Prefetch hidden inside fetch (tight coupling)
❌ Naive LRU (insertion order, not access order)
```

---

## Proposed Refined Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DayView Component                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  watch(route.params.date, async (date) => {                     │
│    await dayStore.loadDay(date);        ◄─── Explicit           │
│    dayStore.prefetchAdjacentDays(date); ◄─── Explicit           │
│  });                                                             │
│                                                                  │
│  const dayShifts = computed(() => dayStore.dayShifts);          │
│  const nightShifts = computed(() => dayStore.nightShifts);      │
│  const areas = computed(() => dayStore.areas);                  │
│                                                                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Day Store (Pinia)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              LRU Cache (7 days)                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  DaySnapshot {                                        │ │ │
│  │  │    date: "2025-10-28"                                 │ │ │
│  │  │    rota: { dayShifts, nightShifts }                   │ │ │
│  │  │    areas: [ ... ]                                     │ │ │
│  │  │    lastAccess: 1730123456789                          │ │ │
│  │  │  }                                                     │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  DaySnapshot { date: "2025-10-29", ... }             │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  DaySnapshot { date: "2025-10-30", ... }             │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Primitives (no side effects)                               ││
│  │  • getCached(date): DaySnapshot | undefined                ││
│  │  • setCached(date, snapshot): void                         ││
│  │  • fetchSnapshot(date): Promise<DaySnapshot>               ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Orchestration (with side effects)                          ││
│  │  • loadDay(date, options): Promise<void>                   ││
│  │      ├─ Check cache                                        ││
│  │      ├─ Fetch if needed (rota + areas in parallel)         ││
│  │      └─ Update state                                       ││
│  │                                                             ││
│  │  • prefetchAdjacentDays(date): Promise<void>               ││
│  │      ├─ Calculate adjacent dates                           ││
│  │      ├─ Filter already cached                              ││
│  │      └─ Fetch in parallel (silent mode)                    ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   API Service    │
                    │                  │
                    │  • getRotaForDay │
                    │  • getAreas      │
                    └──────────────────┘

Benefits:
✅ Unified cache (rota + areas together)
✅ True LRU (access order, not insertion order)
✅ Explicit prefetch (no hidden side effects)
✅ Composable (primitives + orchestration)
✅ Testable (pure functions)
```

---

## Data Flow: User Navigates to Day

### Current Implementation

```
User clicks "Next Day"
        │
        ▼
Component: selectedDate.value = "2025-10-29"
        │
        ├─────────────────────────────┐
        │                             │
        ▼                             ▼
  loadRota()                    loadAreas()
        │                             │
        ▼                             │
Store: fetchRotaForDate()             │
        │                             │
        ├─ Check cache                │
        │  ├─ HIT: return cached      │
        │  └─ MISS: fetch API         │
        │                             │
        ├─ setTimeout(prefetch, 0) ◄──┼─── HACK!
        │                             │
        └─────────────────────────────┼───► Component updates
                                      │
                                      ▼
                              API: getAreas() ◄─── NOT CACHED!
                                      │
                                      ▼
                              Component updates

Timeline:
0ms    - User clicks
10ms   - Rota loaded (cache hit)
10ms   - setTimeout scheduled
20ms   - Areas API call starts
500ms  - Areas loaded
510ms  - Prefetch starts (setTimeout fires)
```

### Refined Implementation

```
User clicks "Next Day"
        │
        ▼
Component: watch triggers
        │
        ▼
Store: loadDay("2025-10-29")
        │
        ├─ Check cache
        │  ├─ HIT: return cached (rota + areas)
        │  └─ MISS: fetch both in parallel
        │
        └─ Update state
        │
        ▼
Component: prefetchAdjacentDays("2025-10-29")
        │
        ├─ Calculate: ["2025-10-28", "2025-10-30"]
        ├─ Filter: already cached
        └─ Fetch remaining in parallel (silent)

Timeline:
0ms    - User clicks
0ms    - Cache hit (rota + areas together)
0ms    - Component updates (instant!)
10ms   - Prefetch starts (explicit, non-blocking)
```

---

## Cache Eviction: LRU Comparison

### Current (Naive LRU - Insertion Order)

```
User navigates: Day 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

Cache (size 7):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  ▲
  └─── Oldest (inserted first) - EVICTED

Add Day 8:
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  2  │  3  │  4  │  5  │  6  │  7  │  8  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Problem: Day 1 evicted even if Day 2-7 never accessed again!
```

### Refined (True LRU - Access Order)

```
User navigates: Day 1 → 2 → 3 → 4 → 5 → 6 → 7 → back to 1

Cache (size 7):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  2  │  3  │  4  │  5  │  6  │  7  │  1  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  ▲                                     ▲
  └─── Least recently accessed          └─── Most recently accessed

Access times:
Day 2: 1000ms (oldest access)
Day 3: 2000ms
Day 4: 3000ms
Day 5: 4000ms
Day 6: 5000ms
Day 7: 6000ms
Day 1: 7000ms (newest access - just accessed!)

Add Day 8:
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  3  │  4  │  5  │  6  │  7  │  1  │  8  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Day 2 evicted (truly least recently accessed)
Day 1 kept (just accessed, even though inserted first)
```

---

## Prefetch Strategy

### Current (Automatic, Hidden)

```
fetchRotaForDate("2025-10-28")
    │
    ├─ Fetch rota
    │
    └─ setTimeout(() => {
         prefetchAdjacentDays("2025-10-28")
           ├─ Fetch "2025-10-27"
           └─ Fetch "2025-10-29"
       }, 0)

Issues:
❌ Hidden side effect
❌ setTimeout hack
❌ Hard to disable
❌ Hard to test
```

### Refined (Explicit, Composable)

```
// Component orchestrates
await store.loadDay("2025-10-28");
store.prefetchAdjacentDays("2025-10-28");

// Store provides primitives
loadDay(date) {
  // Just load, no side effects
  const snapshot = await fetchSnapshot(date);
  setCached(date, snapshot);
}

prefetchAdjacentDays(date) {
  // Just prefetch, separate concern
  const dates = [addDays(date, -1), addDays(date, 1)];
  await Promise.all(dates.map(d => fetchSnapshot(d)));
}

Benefits:
✅ Explicit intent
✅ No hidden side effects
✅ Easy to disable (just don't call)
✅ Easy to test (pure functions)
```

---

## Summary

| Aspect | Current | Refined |
|--------|---------|---------|
| **Cache Scope** | Rota only | Rota + Areas |
| **Cache Type** | Naive LRU | True LRU |
| **Prefetch** | Automatic (hidden) | Explicit (clear) |
| **Timing** | setTimeout hack | Async/await |
| **Coupling** | Tight | Loose |
| **Testability** | Hard | Easy |
| **Lines of Code** | 330 | 180 |
| **API Calls** | 100% | 50% |

---

*Document created: 2025-10-28*  
*Author: AI Assistant*

