# Refactoring Code Examples

**Purpose**: Detailed before/after code examples for major refactorings  
**Reference**: See REFACTORING_ACTION_PLAN.md for full implementation steps

---

## 1. Standardize ID Parsing

### Before (Inconsistent)

**File**: `backend/src/controllers/building.controller.ts`

```typescript
getBuildingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid building ID' });
      return;
    }

    const building = await this.buildingRepo.findById(id);
    
    if (!building) {
      res.status(404).json({ error: 'Building not found' });
      return;
    }

    res.json({ building });
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({ error: 'Failed to fetch building' });
  }
};
```

### After (Consistent)

```typescript
import { parseId } from '../utils/validation.utils';

getBuildingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id, 'Building ID');

    const building = await this.buildingRepo.findById(id);
    
    if (!building) {
      res.status(404).json({ error: 'Building not found' });
      return;
    }

    res.json({ building });
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({ error: 'Failed to fetch building' });
  }
};
```

**Benefits**:
- ✅ Consistent validation across all controllers
- ✅ Better error messages (includes field name)
- ✅ Less code duplication
- ✅ Centralized validation logic

---

## 2. Update Error Codes to PostgreSQL

### Step 1: Create Error Utility

**File**: `backend/src/utils/error.utils.ts` (NEW)

```typescript
/**
 * Error handling utilities for PostgreSQL/Supabase
 */

/**
 * Check if error is a unique constraint violation (duplicate entry)
 * PostgreSQL error code: 23505
 */
export function isDuplicateError(error: any): boolean {
  return error.code === '23505';
}

/**
 * Check if error is a not found error
 * Supabase/PostgREST error code: PGRST116
 */
export function isNotFoundError(error: any): boolean {
  return error.code === 'PGRST116';
}

/**
 * Check if error is a foreign key violation
 * PostgreSQL error code: 23503
 */
export function isForeignKeyError(error: any): boolean {
  return error.code === '23503';
}

/**
 * Get a user-friendly error message for database errors
 */
export function getDatabaseErrorMessage(error: any, entityName: string): string {
  if (isDuplicateError(error)) {
    return `A ${entityName} with this name already exists`;
  }
  
  if (isForeignKeyError(error)) {
    return `Cannot delete ${entityName} because it is referenced by other records`;
  }
  
  return `Failed to process ${entityName}`;
}
```

### Step 2: Update Controllers

**Before** (MySQL error codes):

```typescript
createBuilding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Building name is required' });
      return;
    }

    const building = await this.buildingRepo.create({
      name: name.trim(),
      description: description || null,
    });

    res.status(201).json({ building });
  } catch (error: any) {
    console.error('Error creating building:', error);
    
    // ❌ MySQL error code
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'A building with this name already exists' });
      return;
    }
    
    res.status(500).json({ error: 'Failed to create building' });
  }
};
```

**After** (PostgreSQL error codes):

```typescript
import { isDuplicateError, getDatabaseErrorMessage } from '../utils/error.utils';

createBuilding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Building name is required' });
      return;
    }

    const building = await this.buildingRepo.create({
      name: name.trim(),
      description: description || null,
    });

    res.status(201).json({ building });
  } catch (error: any) {
    console.error('Error creating building:', error);
    
    // ✅ PostgreSQL error code
    if (isDuplicateError(error)) {
      res.status(409).json({ error: getDatabaseErrorMessage(error, 'building') });
      return;
    }
    
    res.status(500).json({ error: 'Failed to create building' });
  }
};
```

**Benefits**:
- ✅ Correct error codes for PostgreSQL
- ✅ Centralized error handling logic
- ✅ Consistent error messages
- ✅ Easier to maintain

---

## 3. Extract Cycle Calculation Logic

### Before (Duplicated 3 times)

**File**: `backend/src/services/rota.service.ts`

```typescript
// Location 1: calculateActiveShifts() - lines 54-65
if (shift.cycleType === '4-on-4-off') {
  const cyclePosition = ((adjustedDays % 8) + 8) % 8;
  if (cyclePosition < 4) {
    activeShifts.push(shift);
  }
} else if (shift.cycleType === '16-day-supervisor') {
  const cyclePosition = ((adjustedDays % 16) + 16) % 16;
  if (cyclePosition < 4 || (cyclePosition >= 8 && cyclePosition < 12)) {
    activeShifts.push(shift);
  }
}

// Location 2: isStaffOnDuty() - lines 96-124
if (staff.status === 'Supervisor') {
  const cyclePosition = ((adjustedDays % 16) + 16) % 16;
  if (cyclePosition < 4) {
    return { onDuty: true, shiftType: 'day' };
  } else if (cyclePosition >= 8 && cyclePosition < 12) {
    return { onDuty: true, shiftType: 'night' };
  } else {
    return { onDuty: false, shiftType: null };
  }
}

if (staff.status === 'Regular' && staff.cycleType === '4-on-4-off') {
  const cyclePosition = ((adjustedDays % 8) + 8) % 8;
  if (cyclePosition < 4) {
    const shiftType = staff.shift?.type || null;
    return { onDuty: true, shiftType };
  } else {
    return { onDuty: false, shiftType: null };
  }
}

// Location 3: isStaffWorkingOnDate() - lines 662-754
// ... similar logic repeated again
```

### After (Centralized)

**File**: `backend/src/utils/cycle.utils.ts` (NEW)

```typescript
import { CycleType } from '../../shared/types/shift';

export const CYCLE_LENGTHS = {
  REGULAR: 8,
  SUPERVISOR: 16,
} as const;

/**
 * Calculate if a staff member is on duty based on their cycle type
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
      shiftType: cyclePosition < 4 ? 'day' : null,
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

**Updated Usage** in `rota.service.ts`:

```typescript
import { calculateCycleStatus, calculateCyclePosition } from '../utils/cycle.utils';

// Location 1: calculateActiveShifts()
for (const shift of allShifts) {
  if (!shift.cycleType || !shift.cycleLength) continue;
  
  const { onDuty } = calculateCycleStatus(shift.cycleType, daysSinceZero, shift.daysOffset);
  if (onDuty) {
    activeShifts.push(shift);
  }
}

// Location 2: isStaffOnDuty()
if (staff.status === 'Supervisor') {
  return calculateCycleStatus('16-day-supervisor', daysSinceZero, effectiveOffset);
}

if (staff.status === 'Regular' && staff.cycleType === '4-on-4-off') {
  const result = calculateCycleStatus('4-on-4-off', daysSinceZero, effectiveOffset);
  return {
    ...result,
    shiftType: result.onDuty ? (staff.shift?.type || null) : null,
  };
}

// Location 3: isStaffWorkingOnDate()
// ... similar simplification
```

**Benefits**:
- ✅ DRY principle - logic defined once
- ✅ Easier to test (pure functions)
- ✅ Easier to maintain (change in one place)
- ✅ Easier to understand (clear function names)
- ✅ Reusable across the codebase

---

## 4. Create Generic Mapper Utility

### Before (Repeated 13 times)

**File**: `backend/src/repositories/shift.repository.ts`

```typescript
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

async findAll(includeInactive = false): Promise<Shift[]> {
  // ... query logic ...
  return (data || []).map(row => this.mapRowToShift(row));
}
```

### After (Centralized)

**File**: `backend/src/utils/mapper.utils.ts` (NEW)

```typescript
/**
 * Generic mapper from snake_case database rows to camelCase domain objects
 */
export function mapSnakeToCamel<T>(row: any, fieldMap: Record<string, string>): T {
  const result: any = {};
  
  for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
    result[camelKey] = row[snakeKey];
  }
  
  return result as T;
}

/**
 * Map an array of database rows to domain objects
 */
export function mapRowsSnakeToCamel<T>(rows: any[], fieldMap: Record<string, string>): T[] {
  return rows.map(row => mapSnakeToCamel<T>(row, fieldMap));
}
```

**Updated Repository**:

```typescript
import { mapSnakeToCamel, mapRowsSnakeToCamel } from '../utils/mapper.utils';
import { Shift } from '../../shared/types/shift';

export class ShiftRepository {
  private static readonly FIELD_MAP: Record<string, string> = {
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

  async findAll(includeInactive = false): Promise<Shift[]> {
    // ... query logic ...
    return mapRowsSnakeToCamel<Shift>(data || [], ShiftRepository.FIELD_MAP);
  }
}
```

**Benefits**:
- ✅ Reduces code duplication across 13 repositories
- ✅ Centralized mapping logic
- ✅ Type-safe mapping
- ✅ Easier to maintain
- ✅ Can add features (e.g., type coercion) in one place

---

## Summary

These refactorings demonstrate:

1. **Consistency** - Standardizing patterns across the codebase
2. **DRY Principle** - Eliminating code duplication
3. **Maintainability** - Easier to update and extend
4. **Type Safety** - Leveraging TypeScript's type system
5. **Testability** - Pure functions are easier to test

**Total Impact**:
- ~500 lines of duplicated code eliminated
- Improved consistency across 20+ files
- Better error handling
- Easier to maintain and extend

**See REFACTORING_ACTION_PLAN.md for complete implementation steps.**

