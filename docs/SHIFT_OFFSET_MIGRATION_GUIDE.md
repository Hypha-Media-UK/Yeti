# Shift-Based Offset Migration Guide

## 🎯 Objective
Migrate from individual staff offsets to shift-based offsets to solve the Netlify timeout issue on `/api/rota/day/:date` endpoint.

## 📊 Current vs New Architecture

### Current (Slow)
- Each staff member has individual `days_offset`
- System queries ALL 85+ staff members
- Loops through each to calculate if working
- N+1 queries for allocations and schedules
- **Result: 28+ seconds, timeout on Netlify**

### New (Fast)
- Shifts have `cycle_type`, `cycle_length`, `days_offset`
- Staff are assigned to a shift via `shift_id`
- System calculates which shifts are active (pure math)
- Only queries staff in active shifts (~20-30 staff)
- **Result: <1 second, no timeout**

---

## 📋 Implementation Plan

### ✅ Phase 1: Database Schema Changes
- [ ] 1.1: Add cycle fields to `shifts` table
- [ ] 1.2: Add `shift_id` to `staff` table (nullable for migration)
- [ ] 1.3: Create migration SQL file
- [ ] 1.4: Test migration on local database

### ✅ Phase 2: Data Migration
- [ ] 2.1: Analyze existing staff data distribution
- [ ] 2.2: Create shift groups based on current patterns
- [ ] 2.3: Assign staff to appropriate shifts
- [ ] 2.4: Verify data integrity

### ✅ Phase 3: Backend Code Changes
- [ ] 3.1: Update TypeScript types (`shared/types/shift.ts`)
- [ ] 3.2: Update `ShiftRepository` to handle new fields
- [ ] 3.3: Create `calculateActiveShifts()` function
- [ ] 3.4: Refactor `getRotaForDate()` to use shift-based filtering
- [ ] 3.5: Update `isStaffOnDuty()` to use shift cycle data
- [ ] 3.6: Update `isStaffWorkingOnDate()` to use shift cycle data

### ✅ Phase 4: Frontend Changes
- [ ] 4.1: Update staff creation/editing forms
- [ ] 4.2: Update shift management UI
- [ ] 4.3: Add shift cycle configuration UI

### ✅ Phase 5: Testing
- [ ] 5.1: Test locally with sample data
- [ ] 5.2: Verify rota calculations are correct
- [ ] 5.3: Test manual assignments still work
- [ ] 5.4: Test supervisor rotation
- [ ] 5.5: Performance test - measure query time

### ✅ Phase 6: Deployment
- [ ] 6.1: Commit all changes
- [ ] 6.2: Push to GitHub
- [ ] 6.3: Deploy to Netlify
- [ ] 6.4: Verify production performance
- [ ] 6.5: Test production rota screen

---

## 🗄️ Database Schema Changes

### New `shifts` table structure:
```sql
ALTER TABLE shifts 
ADD COLUMN cycle_type VARCHAR(50),      -- '4-on-4-off', '16-day-supervisor', 'fixed', 'relief'
ADD COLUMN cycle_length INTEGER,        -- 8, 16, null for relief
ADD COLUMN days_offset INTEGER DEFAULT 0;
```

### New `staff` table structure:
```sql
ALTER TABLE staff 
ADD COLUMN shift_id INTEGER REFERENCES shifts(id);

-- Keep days_offset temporarily for migration, will remove later
-- ALTER TABLE staff DROP COLUMN days_offset;  -- Do this after migration verified
```

---

## 🔄 Shift Groups to Create

Based on current data patterns:

### Day Shifts (4-on-4-off, 8-day cycle)
1. **Day Shift A** - offset 0 (days 0-3 working)
2. **Day Shift B** - offset 4 (days 4-7 working)
3. **Day Shift C** - offset 2 (days 2-5 working)
4. **Day Shift D** - offset 6 (days 6-9 working)

### Night Shifts (4-on-4-off, 8-day cycle)
1. **Night Shift A** - offset 0 (days 0-3 working)
2. **Night Shift B** - offset 4 (days 4-7 working)
3. **Night Shift C** - offset 2 (days 2-5 working)
4. **Night Shift D** - offset 6 (days 6-9 working)

### Supervisor Shifts (16-day cycle)
1. **Supervisor Shift A** - offset 0
2. **Supervisor Shift B** - offset 4
3. **Supervisor Shift C** - offset 8
4. **Supervisor Shift D** - offset 12

### Special Shifts
1. **Relief Pool** - cycle_type: 'relief', no cycle (manual assignments only)
2. **Fixed Schedule** - cycle_type: 'fixed', no cycle (uses fixed_schedules table)

---

## 🔍 Key Code Changes

### 1. Calculate Active Shifts (New Function)
```typescript
function calculateActiveShifts(date: string, appZeroDate: string, allShifts: Shift[]): Shift[] {
  const daysSinceZero = daysBetween(appZeroDate, date);
  const activeShifts: Shift[] = [];

  for (const shift of allShifts) {
    if (shift.cycleType === 'relief' || shift.cycleType === 'fixed') {
      continue; // Skip non-cycling shifts
    }

    const adjustedDays = daysSinceZero - shift.daysOffset;
    const cyclePosition = ((adjustedDays % shift.cycleLength) + shift.cycleLength) % shift.cycleLength;

    if (shift.cycleType === '4-on-4-off') {
      if (cyclePosition < 4) {
        activeShifts.push(shift);
      }
    } else if (shift.cycleType === '16-day-supervisor') {
      // Days 0-3: day shift, Days 8-11: night shift
      if (cyclePosition < 4 || (cyclePosition >= 8 && cyclePosition < 12)) {
        activeShifts.push(shift);
      }
    }
  }

  return activeShifts;
}
```

### 2. Refactored getRotaForDate (Simplified)
```typescript
async getRotaForDate(targetDate: string): Promise<DayRota> {
  const appZeroDate = await this.configRepo.getByKey('app_zero_date');
  
  // 1. Get all shifts
  const allShifts = await this.shiftRepo.findAll();
  
  // 2. Calculate which shifts are active (pure math, no DB)
  const activeShifts = this.calculateActiveShifts(targetDate, appZeroDate, allShifts);
  
  // 3. Get only staff in active shifts (MUCH smaller query)
  const activeShiftIds = activeShifts.map(s => s.id);
  const staffInActiveShifts = await this.staffRepo.findByShiftIds(activeShiftIds);
  
  // 4. Get manual assignments (overrides)
  const manualAssignments = await this.overrideRepo.findByDate(targetDate);
  
  // 5. Process staff and assignments
  // ... rest of logic
}
```

---

## ⚠️ Critical Considerations

### Backward Compatibility
- Keep `staff.days_offset` during migration for rollback
- Manual assignments must continue to work
- Relief staff (no shift assignment) must still work

### Data Integrity
- Every Regular/Supervisor staff must have a `shift_id`
- Relief staff should have `shift_id = NULL` or assigned to "Relief Pool" shift
- Staff with permanent allocations can have any shift (they don't appear in rota anyway)

### Performance Targets
- `/api/rota/day/:date` must complete in <2 seconds
- Should work with 100+ staff members
- All requests must stay under Netlify's 10-second timeout

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Regular staff appear on correct days based on shift offset
- [ ] Supervisors rotate between day/night correctly
- [ ] Relief staff only appear via manual assignments
- [ ] Manual assignments override shift-based schedules
- [ ] Staff with permanent allocations don't appear in rota
- [ ] Fixed schedules still work
- [ ] Temporary area assignments still work

### Performance Tests
- [ ] Rota endpoint completes in <2 seconds locally
- [ ] Rota endpoint completes in <5 seconds on Netlify
- [ ] No 504 timeout errors
- [ ] Database query count reduced (should be ~10 queries max)

### Edge Cases
- [ ] Staff with no shift assigned (should not appear in rota)
- [ ] Shifts with no staff assigned (should not cause errors)
- [ ] Date far in the future (cycle calculations still work)
- [ ] Leap years and DST transitions

---

## 📝 Migration Steps (Detailed)

### Step 1: Analyze Current Data
```sql
-- Count staff by status and offset
SELECT status, days_offset, COUNT(*) 
FROM staff 
WHERE is_active = true 
GROUP BY status, days_offset 
ORDER BY status, days_offset;

-- Find unique offset patterns
SELECT DISTINCT days_offset FROM staff WHERE status = 'Regular' ORDER BY days_offset;
```

### Step 2: Create Shifts
```sql
-- Insert day shifts
INSERT INTO shifts (name, type, cycle_type, cycle_length, days_offset, is_active) VALUES
('Day Shift A', 'day', '4-on-4-off', 8, 0, true),
('Day Shift B', 'day', '4-on-4-off', 8, 4, true),
-- ... more shifts
```

### Step 3: Assign Staff to Shifts
```sql
-- Assign Regular Day staff with offset 0 to Day Shift A
UPDATE staff 
SET shift_id = (SELECT id FROM shifts WHERE name = 'Day Shift A')
WHERE status = 'Regular' 
  AND shift_type = 'day' 
  AND days_offset = 0;
```

---

## 🎯 Success Criteria

✅ **Performance**: Rota endpoint completes in <2 seconds  
✅ **Functionality**: All existing features work correctly  
✅ **Scalability**: Works with 100+ staff members  
✅ **Deployment**: No timeout errors on Netlify  
✅ **Data Integrity**: All staff correctly assigned to shifts  

---

## 🚨 Rollback Plan

If something goes wrong:

1. **Database**: Keep `staff.days_offset` column - can revert code to use it
2. **Code**: Git revert to previous commit
3. **Deployment**: Netlify allows instant rollback to previous deployment

---

## 📌 Milestone Checkpoints

After each phase, verify:
1. ✅ Database changes applied successfully
2. ✅ No TypeScript compilation errors
3. ✅ Backend starts without errors
4. ✅ Frontend builds successfully
5. ✅ Tests pass (if applicable)
6. ✅ Manual testing confirms functionality

**STOP AND CHECK THIS DOCUMENT AFTER EACH PHASE!**


