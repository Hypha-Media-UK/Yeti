# Yeti Staff Rota - Refactoring Action Plan

**Date**: 2025-10-30  
**Based on**: CODE_QUALITY_AUDIT_REPORT.md  
**Priority**: Quick Wins → Medium Effort → Low Priority

---

## 🚀 Quick Wins (4-5 hours total)

These are low-risk, high-impact improvements that can be done immediately.

### 1. Delete Unused Store File ✅ VERIFIED SAFE

**Issue**: `frontend/src/stores/rota.ts` is not used anywhere in the codebase.

**Evidence**:
```bash
$ grep -r "useRotaStore" frontend/src/ --include="*.vue" --include="*.ts" | grep -v "rota.ts"
# No results - store is not imported anywhere
```

**Verification**:
- ✅ `DayView.vue` uses `useDayStore` (line 185)
- ✅ `ConfigView.vue` does NOT import `useRotaStore`
- ✅ No other files import `useRotaStore`

**Action**:
```bash
rm frontend/src/stores/rota.ts
```

**Impact**: Eliminates 230 lines of duplicate code  
**Effort**: 5 minutes  
**Risk**: None (verified unused)

---

### 2. Delete Unused Legacy Repository File

**Issue**: `backend/src/repositories/staff.repository.supabase.ts` is a migration example that's no longer needed.

**Evidence**:
```typescript
/**
 * Staff Repository - Supabase Version
 * 
 * This is an example of how to convert the MySQL repository to use Supabase.
 * Apply the same pattern to all other repository files.
 */
```

**Verification**:
```bash
$ grep -r "staff.repository.supabase" backend/src/
# No imports found
```

**Action**:
```bash
rm backend/src/repositories/staff.repository.supabase.ts
```

**Impact**: Removes confusion for new developers  
**Effort**: 5 minutes  
**Risk**: None (verified unused)

---

### 3. Standardize ID Parsing Across Controllers

**Issue**: Some controllers use `parseInt()` directly, others use the `parseId()` utility.

**Files to Update** (6 controllers):
1. `backend/src/controllers/absence.controller.ts`
2. `backend/src/controllers/building.controller.ts`
3. `backend/src/controllers/department.controller.ts`
4. `backend/src/controllers/service.controller.ts`
5. `backend/src/controllers/shift.controller.ts`
6. `backend/src/controllers/staff.controller.ts`

**Before**:
```typescript
const id = parseInt(req.params.id);
if (isNaN(id)) {
  res.status(400).json({ error: 'Invalid ID' });
  return;
}
```

**After**:
```typescript
import { parseId } from '../utils/validation.utils';

const id = parseId(req.params.id, 'ID');
```

**Impact**: Consistent validation across all controllers  
**Effort**: 30 minutes  
**Risk**: None (utility already exists and is tested)

---

### 4. Update Error Codes from MySQL to PostgreSQL

**Issue**: Controllers check for MySQL error code `ER_DUP_ENTRY`, but we're using PostgreSQL.

**Files to Update** (8 controllers):
1. `backend/src/controllers/building.controller.ts`
2. `backend/src/controllers/department.controller.ts`
3. `backend/src/controllers/service.controller.ts`
4. `backend/src/controllers/shift.controller.ts`
5. `backend/src/controllers/staff.controller.ts`
6. `backend/src/controllers/allocation.controller.ts`
7. `backend/src/controllers/area-operational-hours.controller.ts`
8. `backend/src/controllers/staff-contracted-hours.controller.ts`

**Step 1**: Create error utility
```typescript
// backend/src/utils/error.utils.ts
export function isDuplicateError(error: any): boolean {
  // PostgreSQL unique violation error code
  return error.code === '23505';
}

export function isNotFoundError(error: any): boolean {
  // Supabase/PostgREST not found error code
  return error.code === 'PGRST116';
}
```

**Step 2**: Update controllers
```typescript
// Before
if (error.code === 'ER_DUP_ENTRY') {
  res.status(409).json({ error: 'Duplicate entry' });
  return;
}

// After
import { isDuplicateError } from '../utils/error.utils';

if (isDuplicateError(error)) {
  res.status(409).json({ error: 'Duplicate entry' });
  return;
}
```

**Impact**: Correct error handling for PostgreSQL  
**Effort**: 30 minutes  
**Risk**: None (improves correctness)

---

## 🔧 Medium Effort Improvements (8-12 hours total)

These require more careful implementation but provide significant maintainability benefits.

### 5. Extract Cycle Calculation Logic

**Issue**: Cycle calculation logic is duplicated in 3 places within `rota.service.ts`.

**Locations**:
1. `calculateActiveShifts()` (lines 54-65)
2. `isStaffOnDuty()` (lines 96-124)
3. `isStaffWorkingOnDate()` (lines 662-754)

**Solution**: Create `backend/src/utils/cycle.utils.ts`

```typescript
// backend/src/utils/cycle.utils.ts
import { CycleType } from '../../shared/types/shift';

export const CYCLE_LENGTHS = {
  REGULAR: 8,
  SUPERVISOR: 16,
} as const;

/**
 * Calculate if a staff member is on duty based on their cycle type
 * @param cycleType - The type of cycle (4-on-4-off or 16-day-supervisor)
 * @param daysSinceZero - Days since app zero date
 * @param daysOffset - Personal or shift offset
 * @returns Object with onDuty status and shift type (day/night)
 */
export function calculateCycleStatus(
  cycleType: CycleType,
  daysSinceZero: number,
  daysOffset: number
): { onDuty: boolean; shiftType: 'day' | 'night' | null } {
  const adjustedDays = daysSinceZero - daysOffset;

  if (cycleType === '4-on-4-off') {
    const cyclePosition = ((adjustedDays % CYCLE_LENGTHS.REGULAR) + CYCLE_LENGTHS.REGULAR) % CYCLE_LENGTHS.REGULAR;
    return {
      onDuty: cyclePosition < 4,
      shiftType: cyclePosition < 4 ? 'day' : null, // Assumes day shift, caller can override
    };
  }

  if (cycleType === '16-day-supervisor') {
    const cyclePosition = ((adjustedDays % CYCLE_LENGTHS.SUPERVISOR) + CYCLE_LENGTHS.SUPERVISOR) % CYCLE_LENGTHS.SUPERVISOR;
    
    if (cyclePosition < 4) {
      return { onDuty: true, shiftType: 'day' };
    } else if (cyclePosition >= 8 && cyclePosition < 12) {
      return { onDuty: true, shiftType: 'night' };
    } else {
      return { onDuty: false, shiftType: null };
    }
  }

  return { onDuty: false, shiftType: null };
}

/**
 * Calculate cycle position for a given date
 * @param daysSinceZero - Days since app zero date
 * @param daysOffset - Personal or shift offset
 * @param cycleLength - Length of the cycle (8 or 16)
 * @returns Position in the cycle (0-based)
 */
export function calculateCyclePosition(
  daysSinceZero: number,
  daysOffset: number,
  cycleLength: number
): number {
  const adjustedDays = daysSinceZero - daysOffset;
  return ((adjustedDays % cycleLength) + cycleLength) % cycleLength;
}
```

**Files to Update**:
- `backend/src/services/rota.service.ts` (3 locations)

**Impact**: DRY principle, easier to maintain cycle logic  
**Effort**: 2 hours  
**Risk**: Low (pure functions, easy to test)

**Testing**:
```typescript
// backend/src/utils/__tests__/cycle.utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCycleStatus, calculateCyclePosition } from '../cycle.utils';

describe('calculateCycleStatus', () => {
  it('should calculate 4-on-4-off correctly', () => {
    // Day 0: On duty
    expect(calculateCycleStatus('4-on-4-off', 0, 0)).toEqual({ onDuty: true, shiftType: 'day' });
    // Day 3: On duty (last day)
    expect(calculateCycleStatus('4-on-4-off', 3, 0)).toEqual({ onDuty: true, shiftType: 'day' });
    // Day 4: Off duty
    expect(calculateCycleStatus('4-on-4-off', 4, 0)).toEqual({ onDuty: false, shiftType: null });
    // Day 8: On duty (cycle repeats)
    expect(calculateCycleStatus('4-on-4-off', 8, 0)).toEqual({ onDuty: true, shiftType: 'day' });
  });

  it('should calculate 16-day-supervisor correctly', () => {
    // Day 0-3: Day shift
    expect(calculateCycleStatus('16-day-supervisor', 0, 0)).toEqual({ onDuty: true, shiftType: 'day' });
    // Day 4-7: Off
    expect(calculateCycleStatus('16-day-supervisor', 4, 0)).toEqual({ onDuty: false, shiftType: null });
    // Day 8-11: Night shift
    expect(calculateCycleStatus('16-day-supervisor', 8, 0)).toEqual({ onDuty: true, shiftType: 'night' });
    // Day 12-15: Off
    expect(calculateCycleStatus('16-day-supervisor', 12, 0)).toEqual({ onDuty: false, shiftType: null });
  });

  it('should handle offsets correctly', () => {
    // With offset of 2, day 2 becomes day 0 in the cycle
    expect(calculateCycleStatus('4-on-4-off', 2, 2)).toEqual({ onDuty: true, shiftType: 'day' });
    expect(calculateCycleStatus('4-on-4-off', 6, 2)).toEqual({ onDuty: false, shiftType: null });
  });
});
```

---

### 6. Create Generic Mapper Utility for Repositories

**Issue**: All 13 repositories have nearly identical `mapRowTo*()` functions.

**Solution**: Create a generic mapper utility

```typescript
// backend/src/utils/mapper.utils.ts

/**
 * Generic mapper from snake_case database rows to camelCase domain objects
 * @param row - Database row with snake_case fields
 * @param fieldMap - Mapping of camelCase keys to snake_case keys
 * @returns Mapped object with camelCase fields
 */
export function mapSnakeToCamel<T>(row: any, fieldMap: Record<keyof T, string>): T {
  const result: any = {};
  
  for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
    result[camelKey] = row[snakeKey];
  }
  
  return result as T;
}

/**
 * Map an array of database rows to domain objects
 */
export function mapRowsSnakeToCamel<T>(rows: any[], fieldMap: Record<keyof T, string>): T[] {
  return rows.map(row => mapSnakeToCamel<T>(row, fieldMap));
}
```

**Example Usage**:
```typescript
// Before (in shift.repository.ts)
private mapRowToShift(row: ShiftRow): Shift {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    description: row.description,
    cycleType: row.cycle_type as any,
    cycleLength: row.cycle_length,
    daysOffset: row.days_offset,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// After
import { mapSnakeToCamel } from '../utils/mapper.utils';

private static FIELD_MAP: Record<keyof Shift, string> = {
  id: 'id',
  name: 'name',
  type: 'type',
  color: 'color',
  description: 'description',
  cycleType: 'cycle_type',
  cycleLength: 'cycle_length',
  daysOffset: 'days_offset',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

private mapRowToShift(row: ShiftRow): Shift {
  return mapSnakeToCamel<Shift>(row, ShiftRepository.FIELD_MAP);
}
```

**Files to Update**: All 13 repository files

**Impact**: Reduces code duplication, easier to maintain  
**Effort**: 3-4 hours  
**Risk**: Low (can be done incrementally, one repository at a time)

---

### 7. Add Frontend Tests for Critical Paths

**Issue**: Frontend has minimal test coverage.

**Priority Tests**:

1. **Composables** (2 hours)
   - `useTimeZone.ts` - Date/time utilities
   - `useAbsence.ts` - Absence formatting and status

2. **Store Logic** (3 hours)
   - `day.ts` - Cache behavior, prefetching, invalidation

3. **Key Components** (3 hours)
   - `StaffCard.vue` - Rendering, status badges
   - `ShiftGroup.vue` - Shift grouping logic

**Example Test**:
```typescript
// frontend/tests/composables/useTimeZone.test.ts
import { describe, it, expect } from 'vitest';
import { useTimeZone } from '@/composables/useTimeZone';

describe('useTimeZone', () => {
  const { formatLocalDate, formatLocalTime } = useTimeZone();

  it('should format dates correctly', () => {
    expect(formatLocalDate('2024-01-15')).toBe('Monday, 15 January 2024');
  });

  it('should format times correctly', () => {
    expect(formatLocalTime('14:30:00')).toBe('14:30');
  });
});
```

**Impact**: Confidence in refactoring, regression prevention  
**Effort**: 8 hours  
**Risk**: None (only adds tests)

---

## 📋 Low Priority (Nice to Have)

These can be addressed during future feature development.

### 8. Document Deprecated Field

**Issue**: `useCycleForPermanent` field is marked as deprecated but still in the type definition.

**Action**: Add clear JSDoc comment

```typescript
// shared/types/staff.ts
export interface StaffMember {
  // ... other fields ...
  
  /**
   * @deprecated Use referenceShiftId instead
   * This field is kept for backward compatibility with existing database records
   * but should not be used in new code. It will be removed in a future version
   * after a database migration.
   */
  useCycleForPermanent: boolean;
  
  /**
   * For permanent staff: references a shift whose cycle pattern to use
   * This replaces the deprecated useCycleForPermanent field
   */
  referenceShiftId: number | null;
}
```

**Impact**: Clearer documentation  
**Effort**: 5 minutes  
**Risk**: None

---

### 9. Consider Composable for Building/Department Operations

**Issue**: `BuildingModal.vue` has many emits for building/department operations.

**Current** (lines 155-169):
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updateBuilding': [id: number, name: string];
  'addDepartment': [buildingId: number, name: string];
  'updateDepartment': [id: number, name: string, includeInMainRota: boolean, is24_7: boolean, operationalHours: HoursEntry[]];
  'deleteDepartment': [department: Department];
}>();
```

**Potential Solution**: Create `useBuildingOperations` composable

```typescript
// frontend/src/composables/useBuildingOperations.ts
export function useBuildingOperations() {
  async function updateBuilding(id: number, name: string) {
    await api.updateBuilding(id, { name });
  }

  async function addDepartment(buildingId: number, name: string) {
    await api.createDepartment({ name, buildingId });
  }

  // ... other operations

  return {
    updateBuilding,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
```

**Impact**: Reduced prop drilling, cleaner component code  
**Effort**: 2 hours  
**Risk**: Low

---

## Summary

### Total Effort Estimate
- **Quick Wins**: 4-5 hours
- **Medium Effort**: 8-12 hours
- **Low Priority**: 2-3 hours
- **Total**: 14-20 hours

### Recommended Sequence
1. ✅ Delete unused files (10 min)
2. ✅ Standardize ID parsing (30 min)
3. ✅ Update error codes (30 min)
4. ✅ Extract cycle logic (2 hours)
5. ✅ Create mapper utility (3-4 hours)
6. ✅ Add frontend tests (8 hours)
7. 📋 Low priority items as time permits

### Success Criteria
- ✅ All tests still passing (47/47 backend + new frontend tests)
- ✅ No functionality changes
- ✅ Reduced code duplication
- ✅ Improved maintainability
- ✅ Better error handling

