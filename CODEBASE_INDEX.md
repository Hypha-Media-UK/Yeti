# Yeti Staff Rota Application - Complete Codebase Index

**Last Updated**: 2025-10-30  
**Version**: Stage 1 Complete + Supabase Migration  
**Status**: Production-Ready (Local) | Migration to Vercel In Progress

---

## 📋 Table of Contents

1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Backend Structure](#backend-structure)
6. [Frontend Structure](#frontend-structure)
7. [Business Logic](#business-logic)
8. [API Endpoints](#api-endpoints)
9. [Key Features](#key-features)
10. [Migration Status](#migration-status)
11. [Development Workflow](#development-workflow)
12. [Testing](#testing)

---

## 1. Application Overview

**Yeti** is a comprehensive staff scheduling and rota management application designed for healthcare or shift-based organizations. It manages staff assignments across multiple buildings, departments, and services with support for complex rotation patterns.

### Core Purpose
- Display which staff members are on duty for any selected calendar day
- Manage staff across multiple buildings, departments, and services
- Support complex rotation patterns (4-on-4-off, 16-day supervisor cycles)
- Handle manual assignments, absences, and temporary area assignments
- Provide operational hours management for areas
- Track contracted hours for staff members

### User Personas
- **Shift Coordinators**: View daily rotas, manage assignments
- **Department Managers**: Configure areas, manage staff allocations
- **System Administrators**: Configure shifts, buildings, departments, services

---

## 2. Technology Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router
- **Build Tool**: Vite
- **Styling**: Custom CSS (Design System)
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database Client**: Supabase JS SDK (@supabase/supabase-js)
- **Testing**: Vitest
- **Build Tool**: TypeScript Compiler (tsc)

### Database
- **Current**: Supabase (PostgreSQL 15+)
- **Previous**: MySQL 8.3 (Docker - being phased out)
- **Region**: EU-West-2 (London)
- **Features**: Row Level Security (disabled), Triggers, ENUM types

### Infrastructure
- **Local Development**: Docker Compose
- **Production Deployment**: Netlify (Serverless Functions)
- **Database Hosting**: Supabase Cloud
- **Production URL**: https://yeti-staff-rota.netlify.app

### DevOps
- **Containerization**: Docker
- **Version Control**: Git
- **Package Manager**: npm
- **Environment Management**: dotenv

---

## 3. Architecture

### Overall Architecture Pattern
**Three-Tier Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vue 3)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Views     │  │  Components  │  │    Stores    │      │
│  │  (Pages)     │  │   (UI)       │  │   (Pinia)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │  API Client │                         │
│                     └──────┬──────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Services   │  │ Repositories │      │
│  │ (HTTP Layer) │  │  (Business)  │  │ (Data Layer) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │   Supabase  │                         │
│                     │   Client    │                         │
│                     └──────┬──────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │ PostgreSQL Protocol
┌────────────────────────────▼────────────────────────────────┐
│                  DATABASE (Supabase/PostgreSQL)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  12 Tables | Triggers | Indexes | ENUM Types         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

#### Backend Patterns
1. **Repository Pattern**: Data access abstraction
   - Each entity has its own repository
   - Repositories handle all database operations
   - Converts database rows to domain objects

2. **Service Layer Pattern**: Business logic encapsulation
   - `RotaService`: Complex scheduling calculations
   - `AreaService`: Area and staff management
   - Services orchestrate multiple repositories

3. **Controller Pattern**: HTTP request handling
   - Thin controllers delegate to services
   - Input validation and error handling
   - Response formatting

4. **Dependency Injection**: Constructor-based DI
   - Controllers inject repositories/services
   - Facilitates testing and modularity

#### Frontend Patterns
1. **Composition API**: Vue 3's reactive composition
   - Reusable composables (`useTimeZone`, `useAbsence`)
   - Clear separation of concerns
   - Better TypeScript support

2. **Store Pattern**: Centralized state management (Pinia)
   - `useRotaStore`: Rota data and caching
   - `useStaffStore`: Staff management
   - `useConfigStore`: Application configuration
   - `useDayStore`: Day-specific data with LRU cache

3. **Component Composition**: Reusable UI components
   - Base components (BaseModal, BaseTabs)
   - Feature components (StaffCard, ShiftGroup)
   - Smart vs. Presentational components

---

## 4. Database Schema

### Tables Overview (12 Total)

#### Configuration & Settings
1. **`config`** - Application-wide configuration
   - `app_zero_date`: Reference date for cycle calculations
   - `time_zone`: Application timezone (Europe/London)

#### Organizational Structure
2. **`buildings`** - Physical building locations
3. **`departments`** - Departments within buildings
4. **`services`** - Service areas (not tied to buildings)

#### Shift Management
5. **`shifts`** - Shift definitions and rotation patterns
   - Fields: `name`, `type` (day/night), `cycle_type`, `cycle_length`, `days_offset`
   - Supports: 4-on-4-off, 16-day-supervisor, relief, fixed

#### Staff Management
6. **`staff`** - Staff members
   - Fields: `first_name`, `last_name`, `status`, `shift_id`, `cycle_type`, `days_offset`
   - Custom shift times: `custom_shift_start`, `custom_shift_end`
   - Reference shift: `reference_shift_id` (for permanent staff using shift cycles)
   - Contracted hours override: `use_contracted_hours_for_shift`

7. **`staff_allocations`** - Many-to-many: staff ↔ areas
   - Links staff to departments or services
   - Permanent assignments

8. **`staff_contracted_hours`** - Contracted working hours
   - Day-specific hours (Monday-Sunday)
   - Used for part-time or irregular schedules

9. **`staff_absences`** - Planned and ad-hoc absences
   - Types: sickness, annual_leave, training, absence
   - Date range with start/end datetime

#### Scheduling
10. **`manual_assignments`** - Manual shift assignments
    - Override cycle-based schedules
    - Temporary area assignments
    - Multi-day assignments support

11. **`fixed_schedules`** - Custom shift times (future feature)
    - Currently unused

12. **`area_operational_hours`** - Operational hours for areas
    - Day-specific hours for departments/services

### Key Relationships

```
buildings (1) ──< (N) departments
staff (N) ──< (N) staff_allocations >── (N) departments/services
staff (N) ──> (1) shifts [optional]
staff (1) ──< (N) staff_contracted_hours
staff (1) ──< (N) staff_absences
staff (1) ──< (N) manual_assignments
departments/services (1) ──< (N) area_operational_hours
```

### ENUM Types
- `shift_type`: 'day', 'night'
- `staff_status`: 'Regular', 'Relief', 'Supervisor'
- `area_type`: 'department', 'service'
- `shift_type_assignment`: 'Day', 'Night'
- `absence_type`: 'sickness', 'annual_leave', 'training', 'absence'

---

## 5. Backend Structure

### Directory Layout
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts              # Supabase client configuration
│   ├── controllers/                 # HTTP request handlers (12 files)
│   │   ├── staff.controller.ts
│   │   ├── shift.controller.ts
│   │   ├── rota.controller.ts
│   │   ├── building.controller.ts
│   │   ├── department.controller.ts
│   │   ├── service.controller.ts
│   │   ├── allocation.controller.ts
│   │   ├── area.controller.ts
│   │   ├── absence.controller.ts
│   │   ├── area-operational-hours.controller.ts
│   │   ├── staff-contracted-hours.controller.ts
│   │   └── config.controller.ts
│   ├── repositories/                # Data access layer (13 files)
│   │   ├── staff.repository.ts
│   │   ├── shift.repository.ts
│   │   ├── building.repository.ts
│   │   ├── department.repository.ts
│   │   ├── service.repository.ts
│   │   ├── allocation.repository.ts
│   │   ├── absence.repository.ts
│   │   ├── override.repository.ts
│   │   ├── schedule.repository.ts
│   │   ├── area-operational-hours.repository.ts
│   │   ├── staff-contracted-hours.repository.ts
│   │   └── config.repository.ts
│   ├── services/                    # Business logic layer
│   │   ├── rota.service.ts          # Core scheduling logic
│   │   └── area.service.ts          # Area management logic
│   ├── routes/                      # API route definitions (13 files)
│   │   ├── index.ts                 # Main router
│   │   ├── staff.routes.ts
│   │   ├── shift.routes.ts
│   │   ├── rota.routes.ts
│   │   └── ... (other route files)
│   ├── types/
│   │   └── database.types.ts        # Database-specific types
│   ├── utils/
│   │   └── timezone.ts              # Timezone utilities
│   ├── app.ts                       # Express app configuration
│   └── index.ts                     # Server entry point
├── package.json
└── tsconfig.json
```

### Key Backend Files

#### Core Configuration
- **`database.ts`**: Supabase client setup, helper functions for CRUD operations
- **`app.ts`**: Express middleware, CORS, request logging, route mounting

#### Services (Business Logic)
- **`rota.service.ts`** (600+ lines): 
  - Cycle-based scheduling calculations
  - Manual assignment handling
  - Shift time determination
  - Absence integration
  - Staff working day calculations
  
- **`area.service.ts`** (300+ lines):
  - Area staff retrieval
  - Operational hours checking
  - Permanent allocation management

#### Repositories (Data Access)
All repositories follow the same pattern:
- `findAll()`, `findById()`, `create()`, `update()`, `delete()`
- Map database rows to domain objects
- Handle Supabase-specific queries

---

## 6. Frontend Structure

### Directory Layout
```
frontend/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       ├── main.css             # Component styles
│   │       ├── reset.css            # Browser normalization
│   │       └── variables.css        # Design tokens
│   ├── components/                  # Reusable UI components (22 files)
│   │   ├── AppHeader.vue
│   │   ├── BaseModal.vue
│   │   ├── BaseTabs.vue
│   │   ├── DateSelector.vue
│   │   ├── ShiftGroup.vue
│   │   ├── StaffCard.vue
│   │   ├── StaffForm.vue
│   │   ├── StaffManagementCard.vue
│   │   ├── BuildingCard.vue
│   │   ├── BuildingModal.vue
│   │   ├── DepartmentCard.vue (implied)
│   │   ├── ServiceCard.vue
│   │   ├── ServiceModal.vue
│   │   ├── ShiftCard.vue
│   │   ├── ShiftModal.vue
│   │   ├── ShiftTimesSettings.vue
│   │   ├── OperationalHoursEditor.vue
│   │   ├── ManageAbsencesModal.vue
│   │   ├── QuickAbsenceModal.vue
│   │   ├── TemporaryAssignmentModal.vue
│   │   ├── ManageAssignmentsModal.vue
│   │   └── ConfirmDialog.vue
│   ├── composables/                 # Reusable composition functions
│   │   ├── useTimeZone.ts
│   │   └── useAbsence.ts
│   ├── router/
│   │   └── index.ts                 # Vue Router configuration
│   ├── services/
│   │   └── api.ts                   # API client (all endpoints)
│   ├── stores/                      # Pinia state management
│   │   ├── config.ts                # App configuration
│   │   ├── staff.ts                 # Staff management
│   │   ├── rota.ts                  # Rota with caching
│   │   └── day.ts                   # Day data with LRU cache
│   ├── utils/
│   │   └── lru-cache.ts             # LRU cache implementation
│   ├── views/                       # Page components
│   │   ├── DayView.vue              # Main rota view
│   │   └── ConfigView.vue           # Configuration page
│   ├── App.vue                      # Root component
│   └── main.ts                      # Application entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Key Frontend Files

#### Views (Pages)
- **`DayView.vue`**: Main rota display
  - Date selector
  - Day/Night shift groups
  - Area cards with staff
  - Quick absence modal
  - Temporary assignment modal

- **`ConfigView.vue`**: Configuration interface
  - Tabbed interface (Staff, Buildings, Departments, Services, Shifts, Permanent Staff, Settings)
  - CRUD operations for all entities
  - Staff allocation management

#### Stores (State Management)
- **`day.ts`**: LRU cache for day data (rota + areas)
- **`rota.ts`**: Rota caching with prefetching
- **`staff.ts`**: Staff list management
- **`config.ts`**: App configuration (zero date, timezone)

#### Components
Base components provide reusable UI patterns:
- **`BaseModal.vue`**: Modal dialog wrapper
- **`BaseTabs.vue`**: Tabbed interface
- **`ConfirmDialog.vue`**: Confirmation dialogs

Feature components handle specific functionality:
- **`ShiftGroup.vue`**: Displays day/night shift staff
- **`StaffCard.vue`**: Individual staff member card
- **`StaffForm.vue`**: Staff creation/editing form
- **`DateSelector.vue`**: Date navigation

---

## 7. Business Logic

### Shift Scheduling Algorithm

#### Core Concepts
1. **App Zero Date**: Reference date for all cycle calculations (stored in `config` table)
2. **Days Since Zero**: `daysSinceZero = (targetDate - appZeroDate) in days`
3. **Days Offset**: Each shift/staff can have an offset to stagger rotations
4. **Cycle Position**: `cyclePosition = (daysSinceZero - daysOffset) % cycleLength`

#### Rotation Patterns

**4-on-4-off (Regular Staff)**
- Cycle Length: 8 days
- Pattern: 4 days on, 4 days off
- Working days: cycle positions 0-3

**16-day Supervisor Cycle**
- Cycle Length: 16 days
- Pattern: 4 day shift, 4 off, 4 night shift, 4 off
- Day shift: cycle positions 0-3
- Night shift: cycle positions 8-11
- Off: cycle positions 4-7, 12-15

**Relief Staff**
- No cycle pattern
- Work based on manual assignments only

#### Priority Order for Determining Staff Schedule
1. **Manual Assignments** (highest priority)
   - Overrides all cycle-based calculations
   - Can be shift pool assignments or temporary area assignments
   
2. **Contracted Hours**
   - If staff has `use_contracted_hours_for_shift = true`
   - Or if permanently assigned staff has contracted hours defined
   
3. **Reference Shift Cycle**
   - For permanent staff with `reference_shift_id` set
   - Uses the referenced shift's cycle pattern
   
4. **Shift Cycle**
   - For staff with `shift_id` set
   - Uses the shift's cycle pattern
   
5. **Personal Cycle**
   - For staff with `cycle_type` set but no `shift_id`
   - Uses personal `days_offset`

### Shift Time Determination

```typescript
// Priority order for shift times:
1. Manual assignment custom times (shift_start, shift_end)
2. Staff custom shift times (custom_shift_start, custom_shift_end)
3. Contracted hours for the day
4. Default shift times (08:00-20:00 for day, 20:00-08:00 for night)
```

### Absence Handling
- Absences are fetched for all staff in shifts
- Attached to `staff.currentAbsence` property
- UI displays absence badge and prevents interactions
- Absences don't remove staff from rota (they still appear)

---

## 8. API Endpoints

### Configuration
- `GET /api/config` - Get app configuration
- `PUT /api/config` - Update configuration

### Staff
- `GET /api/staff` - Get all staff (filters: status, includeInactive)
- `GET /api/staff/:id` - Get staff by ID
- `POST /api/staff` - Create staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff
- `GET /api/staff/:staffId/schedules` - Get staff schedules
- `POST /api/staff/:staffId/schedules` - Create staff schedule

### Shifts
- `GET /api/shifts` - Get all shifts
- `GET /api/shifts/type/:type` - Get shifts by type (day/night)
- `GET /api/shifts/:id` - Get shift by ID
- `GET /api/shifts/:id/staff-count` - Get staff count for shift
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift (checks staff count)

### Rota
- `GET /api/rota/day/:date` - Get rota for specific date
- `GET /api/rota/range` - Get rota for date range
- `GET /api/rota/assignments` - Get all assignments
- `POST /api/rota/assignments` - Create assignment
- `POST /api/rota/assignments/temporary` - Create temporary area assignment
- `GET /api/rota/assignments/temporary/:staffId` - Get temporary assignments
- `DELETE /api/rota/assignments/:id` - Delete assignment

### Buildings
- `GET /api/buildings` - Get all buildings
- `GET /api/buildings/:id` - Get building by ID
- `POST /api/buildings` - Create building
- `PUT /api/buildings/:id` - Update building
- `DELETE /api/buildings/:id` - Delete building

### Departments
- `GET /api/departments` - Get all departments (filter: buildingId)
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Allocations
- `GET /api/allocations/staff/:staffId` - Get staff allocations
- `PUT /api/allocations/staff/:staffId` - Set staff allocations (replaces existing)
- `GET /api/allocations/area/:areaType/:areaId` - Get area allocations
- `POST /api/allocations` - Create allocation
- `DELETE /api/allocations/:id` - Delete allocation

### Areas
- `GET /api/areas/main-rota` - Get all main rota areas
- `GET /api/areas/main-rota/day/:dayOfWeek` - Get main rota areas for day
- `GET /api/areas/:areaType/:areaId/staff` - Get area staff (query: date)

### Absences
- `GET /api/absences/staff/:staffId` - Get absences for staff
- `GET /api/absences/staff/:staffId/range` - Get absences in date range
- `GET /api/absences/staff/:staffId/active` - Get active absence
- `POST /api/absences` - Create absence
- `PUT /api/absences/:id` - Update absence
- `DELETE /api/absences/:id` - Delete absence

### Operational Hours
- `GET /api/operational-hours/area/:areaType/:areaId` - Get area operational hours
- `GET /api/operational-hours/day/:dayOfWeek` - Get operational hours by day
- `POST /api/operational-hours` - Create operational hours
- `PUT /api/operational-hours/:id` - Update operational hours
- `DELETE /api/operational-hours/:id` - Delete operational hours
- `PUT /api/operational-hours/area/:areaType/:areaId` - Set all operational hours for area

### Contracted Hours
- `GET /api/contracted-hours/staff/:staffId` - Get contracted hours for staff
- `GET /api/contracted-hours/day/:dayOfWeek` - Get contracted hours by day
- `POST /api/contracted-hours` - Create contracted hours
- `PUT /api/contracted-hours/:id` - Update contracted hours
- `DELETE /api/contracted-hours/:id` - Delete contracted hours
- `PUT /api/contracted-hours/staff/:staffId` - Set all contracted hours for staff

---

## 9. Key Features

### Implemented Features ✅

1. **Daily Rota View**
   - View staff on duty for any selected date
   - Day shift (08:00-20:00) and Night shift (20:00-08:00) columns
   - Real-time shift status (active, pending, expired)
   - Absence indicators

2. **Staff Management**
   - CRUD operations for staff
   - Support for Regular, Relief, and Supervisor status
   - Shift assignment
   - Custom shift times
   - Reference shift for permanent staff
   - Contracted hours override option

3. **Shift Management**
   - Multiple named shifts (e.g., "Day Shift A", "Day Shift B")
   - Configurable rotation patterns
   - Color coding
   - Staff count tracking
   - Deletion protection (warns if staff assigned)

4. **Manual Assignments**
   - Override cycle-based schedules
   - Temporary area assignments
   - Multi-day assignments
   - Custom shift times per assignment

5. **Absence Management**
   - Create/edit/delete absences
   - Multiple absence types
   - Date range support
   - Visual indicators on rota

6. **Area Management**
   - Buildings, Departments, Services
   - Permanent staff allocations
   - Operational hours configuration
   - 24/7 area support

7. **Contracted Hours**
   - Day-specific working hours
   - Part-time staff support
   - Override shift cycle patterns

8. **Caching & Performance**
   - LRU cache for day data (7-day limit)
   - Prefetching adjacent days
   - Optimized database queries
   - Batch operations for absences

9. **Timezone Support**
   - Europe/London timezone
   - Handles shifts crossing midnight
   - Consistent date/time handling

10. **Design System**
    - Custom design system (not Material Design)
    - Accessible (WCAG AA)
    - Responsive layout
    - Consistent iconography

### User Preferences (from Memories)
- Staff with 'No Shift' (shift_id = NULL) don't appear on rota
- Staff with 'No Shift' have pale grey background in staff lists
- Deleting a shift auto-sets assigned staff to 'No Shift'
- Inline buttons preferred over right-click menus
- Consistent iconography throughout
- Local testing before deployment
- Consultation before deployment decisions

---

## 10. Migration Status

### Completed ✅
- **Database Migration**: MySQL → Supabase PostgreSQL
  - All 12 tables migrated
  - 409 rows migrated successfully
  - Schema converted (AUTO_INCREMENT → SERIAL, ENUM types, etc.)
  - Triggers created for auto-update timestamps

- **Backend Configuration**:
  - Supabase client configured
  - All repositories converted to Supabase
  - Helper functions for CRUD operations

- **Environment Setup**:
  - Supabase credentials configured
  - Connection pooler enabled

- **Production Deployment**: ✅ **LIVE**
  - Deployed to Netlify
  - Production URL: https://yeti-staff-rota.netlify.app
  - Serverless function deployed (api.js)
  - Deploy time: 8 seconds
  - Status: Ready

### Production Statistics
- **85 active staff members** in production
- **11 active shifts** (6 day, 5 night)
- **16 buildings** with 66 departments
- **9 services** all in main rota
- **42 permanent staff allocations**
- **7 manual assignments** created
- **5+ staff** using contracted hours

### Rollback Available
- MySQL Docker still running locally
- Backup available: `backup_20251028_093555_absence_system_complete.sql`

---

## 11. Development Workflow

### Local Development Setup

1. **Prerequisites**
   - Docker Desktop or Orbstack
   - Node.js 18+ (for local development outside Docker)
   - Git

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start Services**
   ```bash
   docker-compose up --build
   ```

4. **Access Points**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Database Admin (Adminer): http://localhost:8080 (if using MySQL)
   - Supabase Dashboard: https://supabase.com/dashboard/project/zqroxxjfkcmcxryuatex

### Development Commands

**Backend**
```bash
# Inside Docker
docker-compose exec backend npm run dev      # Start dev server
docker-compose exec backend npm test         # Run tests
docker-compose exec backend npm run build    # Build for production

# Local
cd backend
npm run dev
npm test
npm run build
```

**Frontend**
```bash
# Inside Docker
docker-compose exec frontend npm run dev     # Start dev server
docker-compose exec frontend npm test        # Run tests
docker-compose exec frontend npm run build   # Build for production

# Local
cd frontend
npm run dev
npm test
npm run build
```

### Code Organization Principles

1. **Shared Types**: All TypeScript types in `/shared/types/`
2. **Single Responsibility**: Each file has one clear purpose
3. **Dependency Injection**: Constructor-based DI in backend
4. **Composition over Inheritance**: Vue Composition API
5. **Explicit over Implicit**: Clear naming, no magic

---

## 12. Testing

### Backend Testing
- **Framework**: Vitest
- **Coverage**: 47/47 tests passing (100%)
- **Test Files**: `backend/src/services/__tests__/`
- **Focus**: Service layer business logic

### Frontend Testing
- **Framework**: Vitest + Vue Test Utils
- **Status**: Basic setup in place
- **Test Files**: `frontend/tests/`

### Manual Testing Checklist
- [ ] View rota for different dates
- [ ] Create/edit/delete staff
- [ ] Create/edit/delete shifts
- [ ] Assign staff to shifts
- [ ] Create manual assignments
- [ ] Create/edit/delete absences
- [ ] Configure operational hours
- [ ] Configure contracted hours
- [ ] Test timezone handling
- [ ] Test shift crossing midnight
- [ ] Test caching and prefetching

---

## 📚 Additional Documentation

- **DESIGN_SYSTEM.md**: Complete design system specification
- **MIGRATION_STATUS.md**: Detailed migration progress
- **SETUP.md**: Setup instructions
- **QUICKSTART.md**: Quick start guide
- **SHIFT_SYSTEM_TESTING.md**: Shift system testing documentation
- **STAGE1_COMPLETION.md**: Stage 1 completion summary

---

## 🔑 Key Insights

### Architectural Strengths
1. **Clean Separation**: Clear boundaries between layers
2. **Type Safety**: Full TypeScript coverage
3. **Testability**: Dependency injection enables easy testing
4. **Scalability**: Repository pattern allows easy database swaps
5. **Performance**: Intelligent caching reduces API calls

### Complex Areas
1. **Rota Calculation**: `rota.service.ts` contains intricate cycle logic
2. **Timezone Handling**: Careful date/time manipulation throughout
3. **Caching Strategy**: LRU cache with prefetching in frontend
4. **Manual Assignment Priority**: Complex override logic

### Technical Debt
1. **Fixed Schedules**: Table exists but feature not implemented
2. **Authentication**: No auth system (as per requirements)
3. **RLS**: Row Level Security disabled in Supabase
4. **Test Coverage**: Frontend tests minimal

---

**End of Codebase Index**

