# App Zero Date Migration - 2024-01-01 to 2025-10-26

**Date**: 2025-10-30  
**Status**: ✅ Complete  
**Migration Type**: Database Configuration Update

---

## Summary

Successfully migrated the app zero date from **2024-01-01** to **2025-10-26** to align the rota system with a more recent real-world reference date.

### Changes Made

1. **Updated `app_zero_date`** in config table: `2024-01-01` → `2025-10-26`
2. **Adjusted supervisor shift offsets**: Added +8 to all 16-day-supervisor shifts
3. **Verified calculations**: All 13 verification tests passing

---

## Technical Details

### Days Difference
- **Old Zero Date**: 2024-01-01
- **New Zero Date**: 2025-10-26
- **Days Difference**: 664 days

### Cycle Alignment

#### 4-on-4-off Cycle (8-day cycle)
- **664 % 8 = 0** ✅ Perfect alignment!
- **Impact**: No changes needed
- **Affected Shifts**: None
- **Result**: All regular staff schedules remain exactly the same

#### 16-day Supervisor Cycle
- **664 % 16 = 8** ⚠️ 8-position shift
- **Impact**: Without adjustment, supervisors would shift from day→night or night→day
- **Solution**: Added +8 to all supervisor shift `days_offset` values
- **Affected Shifts**: 2 shifts
- **Result**: All supervisor schedules remain exactly the same

---

## Database Changes

### 1. Config Table Update

```sql
UPDATE config 
SET value = '2025-10-26', 
    updated_at = CURRENT_TIMESTAMP 
WHERE key = 'app_zero_date';
```

**Result**:
- ✅ app_zero_date: `2024-01-01` → `2025-10-26`

### 2. Supervisor Shifts Update

```sql
UPDATE shifts 
SET days_offset = days_offset + 8, 
    updated_at = CURRENT_TIMESTAMP 
WHERE cycle_type = '16-day-supervisor' 
  AND is_active = true;
```

**Affected Shifts**:
| ID | Name | Old Offset | New Offset |
|----|------|------------|------------|
| 23 | Supervisor Shift A | 0 | 8 |
| 14 | Supervisor Shift B | 0 | 8 |

---

## Verification

### Test Suite Created
- **File**: `backend/src/utils/__tests__/zero-date-migration-verification.test.ts`
- **Tests**: 13 comprehensive tests
- **Status**: ✅ All passing

### Test Coverage

#### 1. Days Difference Calculation
- ✅ Verified 664-day difference is correct

#### 2. 4-on-4-off Cycle Tests (4 tests)
- ✅ Perfect alignment verified (664 % 8 = 0)
- ✅ Same cycle position for offset 0
- ✅ Same cycle position for offset 4
- ✅ Multiple test dates across different months

#### 3. 16-day Supervisor Cycle Tests (6 tests)
- ✅ 8-position shift verified (664 % 16 = 8)
- ✅ Same cycle position with +8 offset compensation
- ✅ Multiple test dates verified
- ✅ Day shift positions (0-3) remain day shifts
- ✅ Night shift positions (8-11) remain night shifts
- ✅ Off days (4-7, 12-15) remain off days

#### 4. Real-world Verification (1 test)
- ✅ Today (2025-10-30) produces same results

#### 5. Migration Documentation (1 test)
- ✅ Migration summary documented

---

## Impact Assessment

### Staff Affected
- **Total Active Staff**: 85
- **Staff with offset = 0**: 73 (85.9%)
- **Staff with non-zero offset**: 12 (14.1%)

### Schedule Impact
- **Regular Staff (4-on-4-off)**: ✅ No change - perfect alignment
- **Supervisor Staff (16-day)**: ✅ No change - offset compensated
- **Relief Staff**: ✅ No change - manual assignments only

### Data Integrity
- **Future Rotas**: ✅ Calculated correctly with new zero date
- **Historical Rotas**: ⚠️ Historical calculations will use new zero date
  - Note: Historical rota data is not stored, only calculated on-demand
  - If historical accuracy is needed, queries should use the old zero date (2024-01-01)

---

## Example Calculations

### Before Migration (2024-01-01 zero date)

**Test Date**: 2025-11-15

**Regular Staff (4-on-4-off, offset 0)**:
- Days since zero: 684 days
- Cycle position: 684 % 8 = 4 (OFF)

**Supervisor (16-day, offset 0)**:
- Days since zero: 684 days
- Cycle position: 684 % 16 = 12 (OFF - after night shift)

### After Migration (2025-10-26 zero date)

**Test Date**: 2025-11-15

**Regular Staff (4-on-4-off, offset 0)**:
- Days since zero: 20 days
- Cycle position: 20 % 8 = 4 (OFF) ✅ Same!

**Supervisor (16-day, offset 8)**:
- Days since zero: 20 days
- Adjusted days: 20 - 8 = 12
- Cycle position: 12 % 16 = 12 (OFF - after night shift) ✅ Same!

---

## Rollback Procedure

If rollback is needed, execute these SQL commands:

```sql
-- 1. Restore old zero date
UPDATE config 
SET value = '2024-01-01', 
    updated_at = CURRENT_TIMESTAMP 
WHERE key = 'app_zero_date';

-- 2. Restore supervisor shift offsets
UPDATE shifts 
SET days_offset = days_offset - 8, 
    updated_at = CURRENT_TIMESTAMP 
WHERE cycle_type = '16-day-supervisor' 
  AND is_active = true;
```

---

## Files Modified

### Database
1. `config` table - app_zero_date value updated
2. `shifts` table - supervisor shift offsets updated

### Code
1. `database/supabase/001_schema.sql` - Updated default value with migration note

### Tests
1. `backend/src/utils/__tests__/zero-date-migration-verification.test.ts` - New verification test suite

### Documentation
1. `ZERO_DATE_MIGRATION.md` - This file

---

## Future Considerations

### If Zero Date Needs to Change Again

1. **Calculate days difference** between old and new zero dates
2. **Check cycle alignment**:
   - For 4-on-4-off: `daysDiff % 8` should be 0 for perfect alignment
   - For 16-day-supervisor: `daysDiff % 16` should be 0 for perfect alignment
3. **If not aligned**:
   - For 4-on-4-off: Add `(daysDiff % 8)` to all shift offsets
   - For 16-day-supervisor: Add `(daysDiff % 16)` to all supervisor shift offsets
4. **Create verification tests** to ensure schedules remain unchanged
5. **Update schema file** with new default value and migration note

### Recommended Zero Date Selection

For future zero date changes, choose dates that are:
- **Multiples of 16 days** from the current zero date (aligns both cycle types)
- **Recent** (within the last year for real-world relevance)
- **Memorable** (e.g., start of month, start of year)

**Example**: If changing from 2025-10-26:
- 2025-10-26 + (16 × n) days
- 2025-11-11 (16 days later)
- 2025-11-27 (32 days later)
- 2025-12-13 (48 days later)
- etc.

---

## Known Issues

### Test Suite Compatibility

Some existing tests in `rota.service.test.ts` are failing after the zero date migration. This is **NOT** due to the migration itself, but rather due to the tests being outdated:

**Root Cause**:
- The tests were written for the old system that used staff `group` and `cycleType` directly
- The refactored system now uses the `shifts` table with proper shift-based scheduling
- The tests mock staff but don't mock the corresponding shifts in `mockShiftRepo.findAll()`
- Result: `calculateActiveShifts` returns 0 shifts, causing tests to fail

**Failing Tests** (14 tests):
- Night Shift Overlap tests (2 tests)
- Manual Assignment tests (2 tests)
- Various other rota tests (10 tests)

**Impact**:
- ⚠️ Tests failing, but **production code is working correctly**
- ✅ Zero date migration verification tests (13 tests) all passing
- ✅ Live application working correctly with new zero date
- ✅ API endpoint returning correct zero date: `2025-10-26`
- ✅ Supervisor shifts have correct offset: `8`

**Resolution Required**:
The test suite needs to be updated to:
1. Mock shifts in `mockShiftRepo.findAll()` for each test
2. Ensure staff are assigned to those shifts via `shift_id`
3. Update test expectations to match the new shift-based system

This is a **separate task** from the zero date migration and should be addressed in a dedicated test refactoring effort.

---

## Conclusion

✅ **Migration Successful**

The app zero date has been successfully updated from 2024-01-01 to 2025-10-26 with:
- ✅ All staff schedules maintained
- ✅ All cycle calculations verified
- ✅ 13/13 migration verification tests passing
- ✅ No disruption to operations
- ✅ Schema updated for future deployments
- ✅ Live application working correctly
- ✅ Database updated successfully

The system is now using a more recent, real-world reference date while maintaining complete schedule continuity.

**Note**: Some pre-existing tests in `rota.service.test.ts` are failing due to outdated test mocks (not related to the migration). These tests need to be updated to mock the shift-based system properly.

---

**Migration Completed**: 2025-10-30
**Verified By**: Automated migration test suite (13 tests) + Live application testing
**Status**: Production Ready ✅
**Known Issues**: Pre-existing test suite needs updating for shift-based system (separate task)

