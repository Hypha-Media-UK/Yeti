# Yeti Staff Rota - Quick Reference Guide

**Last Updated**: 2025-10-30

---

## 🚀 Quick Start

### Start the Application
```bash
# Start all services (Docker)
docker-compose up

# Access points:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000
# - Supabase Dashboard: https://supabase.com/dashboard/project/zqroxxjfkcmcxryuatex
```

### Stop the Application
```bash
docker-compose down
```

---

## 📁 File Locations

### Most Important Files

**Backend Core Logic**
- `backend/src/services/rota.service.ts` - Shift scheduling algorithm (600+ lines)
- `backend/src/services/area.service.ts` - Area management logic
- `backend/src/config/database.ts` - Supabase client configuration

**Frontend Core Components**
- `frontend/src/views/DayView.vue` - Main rota display
- `frontend/src/views/ConfigView.vue` - Configuration interface
- `frontend/src/stores/day.ts` - Day data with LRU cache
- `frontend/src/stores/rota.ts` - Rota caching

**Shared Types**
- `shared/types/staff.ts` - Staff member types
- `shared/types/shift.ts` - Shift and assignment types
- `shared/types/department.ts` - Department types
- `shared/types/service.ts` - Service types
- `shared/types/absence.ts` - Absence types

**Configuration**
- `.env` - Root environment variables
- `backend/.env` - Backend environment variables
- `frontend/.env` - Frontend environment variables
- `docker-compose.yml` - Docker orchestration

**Documentation**
- `CODEBASE_INDEX.md` - Complete codebase overview (this is comprehensive!)
- `DESIGN_SYSTEM.md` - UI design system
- `MIGRATION_STATUS.md` - Migration progress
- `README.md` - Basic project info

---

## 🔧 Common Development Tasks

### Adding a New Staff Member (Code)

**Backend Repository** (`backend/src/repositories/staff.repository.ts`):
```typescript
async create(staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffMember> {
  const { data, error } = await supabase
    .from('staff')
    .insert({
      first_name: staff.firstName,
      last_name: staff.lastName,
      status: staff.status,
      shift_id: staff.shiftId,
      // ... other fields
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create staff: ${error.message}`);
  return this.mapRowToStaffMember(data);
}
```

**Frontend API Call** (`frontend/src/services/api.ts`):
```typescript
async createStaff(staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch(`${API_URL}/api/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(staff)
  });
  return response.json();
}
```

### Adding a New API Endpoint

1. **Create Route** (`backend/src/routes/example.routes.ts`):
```typescript
import { Router } from 'express';
import { ExampleController } from '../controllers/example.controller';

const router = Router();
const controller = new ExampleController();

router.get('/', controller.getAll);
router.post('/', controller.create);

export default router;
```

2. **Create Controller** (`backend/src/controllers/example.controller.ts`):
```typescript
import { Request, Response } from 'express';
import { ExampleRepository } from '../repositories/example.repository';

export class ExampleController {
  private repo: ExampleRepository;
  
  constructor() {
    this.repo = new ExampleRepository();
  }
  
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.repo.findAll();
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  };
}
```

3. **Create Repository** (`backend/src/repositories/example.repository.ts`):
```typescript
import { supabase } from '../config/database';

export class ExampleRepository {
  async findAll(): Promise<Example[]> {
    const { data, error } = await supabase
      .from('examples')
      .select('*');
    
    if (error) throw new Error(`Failed to find: ${error.message}`);
    return data || [];
  }
}
```

4. **Register Route** (`backend/src/routes/index.ts`):
```typescript
import exampleRoutes from './example.routes';
router.use('/examples', exampleRoutes);
```

### Adding a New Vue Component

**Create Component** (`frontend/src/components/ExampleCard.vue`):
```vue
<template>
  <div class="card">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

interface Props {
  title: string;
  description: string;
}

const props = defineProps<Props>();
</script>

<style scoped>
.card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
}
</style>
```

### Adding a New Pinia Store

**Create Store** (`frontend/src/stores/example.ts`):
```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';

export const useExampleStore = defineStore('example', () => {
  // State
  const items = ref<Example[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // Computed
  const activeItems = computed(() => items.value.filter(i => i.isActive));
  
  // Actions
  async function fetchItems() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.getExamples();
      items.value = response.items;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch';
    } finally {
      isLoading.value = false;
    }
  }
  
  return { items, isLoading, error, activeItems, fetchItems };
});
```

---

## 🗄️ Database Operations

### Query Supabase Directly

**Using Supabase Client**:
```typescript
import { supabase } from '../config/database';

// Simple select
const { data, error } = await supabase
  .from('staff')
  .select('*')
  .eq('is_active', true);

// With joins (using foreign key relationships)
const { data, error } = await supabase
  .from('staff')
  .select(`
    *,
    shift:shifts(*)
  `)
  .eq('is_active', true);

// Insert
const { data, error } = await supabase
  .from('staff')
  .insert({ first_name: 'John', last_name: 'Doe', status: 'Regular' })
  .select()
  .single();

// Update
const { data, error } = await supabase
  .from('staff')
  .update({ is_active: false })
  .eq('id', 123)
  .select()
  .single();

// Delete
const { error } = await supabase
  .from('staff')
  .delete()
  .eq('id', 123);
```

### Common Database Queries

**Get all staff in a shift**:
```typescript
const { data } = await supabase
  .from('staff')
  .select('*')
  .eq('shift_id', shiftId)
  .eq('is_active', true);
```

**Get staff with absences**:
```typescript
const { data } = await supabase
  .from('staff')
  .select(`
    *,
    absences:staff_absences(*)
  `)
  .eq('is_active', true);
```

**Get departments with building info**:
```typescript
const { data } = await supabase
  .from('departments')
  .select(`
    *,
    building:buildings(*)
  `)
  .eq('is_active', true);
```

---

## 🧪 Testing

### Run Backend Tests
```bash
# Inside Docker
docker-compose exec backend npm test

# Watch mode
docker-compose exec backend npm run test:watch

# With coverage
docker-compose exec backend npm run test:coverage
```

### Run Frontend Tests
```bash
# Inside Docker
docker-compose exec frontend npm test

# Watch mode
docker-compose exec frontend npm run test:watch
```

### Manual Testing Checklist
- [ ] View rota for today
- [ ] Navigate to different dates
- [ ] Create a new staff member
- [ ] Assign staff to a shift
- [ ] Create a manual assignment
- [ ] Create an absence
- [ ] View staff in Config page
- [ ] Edit operational hours
- [ ] Test caching (navigate back/forward quickly)

---

## 🐛 Debugging

### Backend Debugging

**View Logs**:
```bash
docker-compose logs -f backend
```

**Check Database Connection**:
```bash
# Backend will log on startup:
# "Supabase connection established successfully"
```

**Common Issues**:
- **500 errors**: Check backend logs for stack traces
- **Database errors**: Verify Supabase credentials in `backend/.env`
- **CORS errors**: Check `backend/src/app.ts` CORS configuration

### Frontend Debugging

**View Logs**:
```bash
docker-compose logs -f frontend
```

**Browser Console**:
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed API calls

**Common Issues**:
- **API errors**: Check `VITE_API_URL` in `frontend/.env`
- **Blank page**: Check browser console for errors
- **Caching issues**: Clear cache or use `skipCache: true` option

### Database Debugging

**Supabase Dashboard**:
1. Go to https://supabase.com/dashboard/project/zqroxxjfkcmcxryuatex
2. Click "Table Editor" to view data
3. Click "SQL Editor" to run queries
4. Click "Logs" to view database logs

**Common Queries**:
```sql
-- Check staff count
SELECT COUNT(*) FROM staff WHERE is_active = true;

-- Check shifts
SELECT * FROM shifts WHERE is_active = true;

-- Check manual assignments for today
SELECT * FROM manual_assignments WHERE assignment_date = CURRENT_DATE;

-- Check absences
SELECT s.first_name, s.last_name, a.* 
FROM staff_absences a
JOIN staff s ON s.id = a.staff_id
WHERE a.end_datetime >= NOW();
```

---

## 📊 Key Concepts

### Shift Scheduling Priority

When determining if a staff member works on a given day:

1. **Manual Assignment** (Highest Priority)
   - Overrides everything
   - Can be shift pool or temporary area assignment

2. **Contracted Hours**
   - If `use_contracted_hours_for_shift = true`
   - Or if permanently assigned with contracted hours

3. **Reference Shift Cycle**
   - For permanent staff with `reference_shift_id`
   - Uses referenced shift's cycle pattern

4. **Shift Cycle**
   - For staff with `shift_id` set
   - Uses shift's cycle pattern

5. **Personal Cycle**
   - For staff with `cycle_type` but no `shift_id`
   - Uses personal `days_offset`

### Cycle Calculations

**Formula**:
```
daysSinceZero = targetDate - appZeroDate (in days)
adjustedDays = daysSinceZero - daysOffset
cyclePosition = adjustedDays % cycleLength
```

**4-on-4-off Pattern** (8-day cycle):
- Working: positions 0-3
- Off: positions 4-7

**16-day Supervisor Pattern**:
- Day shift: positions 0-3
- Off: positions 4-7
- Night shift: positions 8-11
- Off: positions 12-15

### Caching Strategy

**Frontend Caching**:
- LRU cache with 7-day limit
- Prefetches adjacent days in background
- Cache key: date string (YYYY-MM-DD)
- Invalidated on: manual assignment changes, absence changes

**Cache Methods**:
```typescript
// Load with cache
await dayStore.loadDay(date);

// Force refresh
await dayStore.loadDay(date, { skipCache: true });

// Clear cache
dayStore.clearRotaCache();

// Get cache stats
const stats = dayStore.getCacheStats();
```

---

## 🔐 Environment Variables

### Backend (.env)
```bash
# Supabase
SUPABASE_URL=https://zqroxxjfkcmcxryuatex.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=3000
NODE_ENV=development
TZ=Europe/London
```

### Frontend (.env)
```bash
# API
VITE_API_URL=http://localhost:3000
```

---

## 📦 Deployment

### Netlify Deployment (LIVE)

**Production URL**: https://yeti-staff-rota.netlify.app
**Admin Dashboard**: https://app.netlify.com/projects/yeti-staff-rota
**Status**: ✅ Ready (Deployed 2025-10-29)

**Deployment Process**:
1. Push code to GitHub
2. Netlify auto-deploys from main branch
3. Build command: `cd frontend && npm install && npm run build`
4. Publish directory: `frontend/dist`
5. Functions directory: `netlify/functions`

**Environment Variables in Netlify**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TZ=Europe/London`

**Manual Deploy**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## 🆘 Emergency Procedures

### Rollback Database
```bash
# MySQL backup available at:
# database/backups/backup_20251028_093555_absence_system_complete.sql

# To restore (if needed):
# 1. Start MySQL Docker container
# 2. Import backup
# 3. Update backend/.env to use MySQL
# 4. Restart backend
```

### Reset Supabase Data
```sql
-- WARNING: This deletes all data!
TRUNCATE TABLE manual_assignments CASCADE;
TRUNCATE TABLE staff_absences CASCADE;
TRUNCATE TABLE staff_contracted_hours CASCADE;
TRUNCATE TABLE area_operational_hours CASCADE;
TRUNCATE TABLE staff_allocations CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE shifts CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE buildings CASCADE;
```

### Clear Frontend Cache
```typescript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📞 Support Resources

- **Codebase Index**: `CODEBASE_INDEX.md` (comprehensive overview)
- **Live Production Status**: `LIVE_PRODUCTION_STATUS.md` (real-time data)
- **Design System**: `DESIGN_SYSTEM.md`
- **Migration Status**: `MIGRATION_STATUS.md`
- **Production App**: https://yeti-staff-rota.netlify.app
- **Netlify Dashboard**: https://app.netlify.com/projects/yeti-staff-rota
- **Supabase Dashboard**: https://supabase.com/dashboard/project/zqroxxjfkcmcxryuatex
- **Supabase Docs**: https://supabase.com/docs
- **Netlify Docs**: https://docs.netlify.com/

---

**End of Quick Reference**

