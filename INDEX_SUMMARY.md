# Yeti Staff Rota - Documentation Index

**Created**: 2025-10-30  
**Purpose**: Central navigation for all codebase documentation

---

## 📚 Documentation Overview

This repository contains comprehensive documentation for the Yeti Staff Rota application. Use this index to find the information you need quickly.

---

## 🎯 Start Here

### New to the Project?
1. **Read**: `README.md` - Basic project overview
2. **Read**: `QUICKSTART.md` - Get the app running in 5 minutes
3. **Read**: `CODEBASE_INDEX.md` - Comprehensive codebase overview
4. **Bookmark**: `QUICK_REFERENCE.md` - Common tasks and commands

### Need to Understand the Architecture?
1. **Read**: `CODEBASE_INDEX.md` - Section 3: Architecture
2. **View**: Architecture diagrams (rendered in this session)
3. **Read**: `DESIGN_SYSTEM.md` - UI/UX design principles

### Working on Features?
1. **Reference**: `QUICK_REFERENCE.md` - Code examples
2. **Reference**: `CODEBASE_INDEX.md` - Section 5-6: Backend/Frontend structure
3. **Check**: `shared/types/` - TypeScript type definitions

### Deploying or Migrating?
1. **Read**: `LIVE_PRODUCTION_STATUS.md` - Current production status with live data
2. **Read**: `MIGRATION_STATUS.md` - Migration history
3. **Visit**: https://yeti-staff-rota.netlify.app - Live production app

---

## 📖 Documentation Files

### Core Documentation

#### `LIVE_PRODUCTION_STATUS.md` ⭐ **LIVE DATA**
**Purpose**: Real-time production status with live database statistics
**Contents**:
- Production URLs (Netlify deployment)
- Live database statistics (85 active staff, 11 shifts, 16 buildings)
- Staff distribution across shifts
- Buildings and departments breakdown
- Services overview
- Manual assignments and absences
- Advanced features in use (contracted hours, custom shift times)
- Netlify deployment status
- Usage patterns and data quality observations
- System health metrics
- Recommendations

**When to Use**:
- Checking current production status
- Understanding real usage patterns
- Verifying deployment health
- Seeing actual data in the system
- Monitoring system metrics

---

#### `CODEBASE_INDEX.md` ⭐ **MOST COMPREHENSIVE**
**Purpose**: Complete codebase overview and reference  
**Contents**:
- Application overview and purpose
- Technology stack details
- Architecture patterns and diagrams
- Database schema (12 tables)
- Backend structure (controllers, services, repositories)
- Frontend structure (views, components, stores)
- Business logic (shift scheduling algorithm)
- API endpoints (all 50+ endpoints)
- Key features and implementation status
- Migration status
- Development workflow
- Testing information

**When to Use**: 
- Understanding the entire system
- Onboarding new developers
- Planning new features
- Debugging complex issues

---

#### `QUICK_REFERENCE.md` ⭐ **MOST PRACTICAL**
**Purpose**: Quick reference for common development tasks  
**Contents**:
- Quick start commands
- File locations (most important files)
- Common development tasks (with code examples)
- Database operations
- Testing commands
- Debugging tips
- Key concepts (shift scheduling, caching)
- Environment variables
- Deployment procedures
- Emergency procedures

**When to Use**:
- Daily development work
- Adding new features
- Debugging issues
- Looking up commands
- Finding file locations

---

#### `DESIGN_SYSTEM.md`
**Purpose**: UI/UX design system specification  
**Contents**:
- Color system (primary, backgrounds, states)
- Typography (fonts, sizes, weights)
- Layout and spacing (8px grid system)
- Border radius standards
- Elevation (shadows)
- Transitions and animations
- Responsive breakpoints
- Component specifications
- Accessibility guidelines
- UX tone and content style

**When to Use**:
- Designing new UI components
- Ensuring visual consistency
- Implementing responsive layouts
- Accessibility compliance

---

### Migration Documentation

#### `MIGRATION_STATUS.md`
**Purpose**: Current state of MySQL → Supabase migration  
**Contents**:
- Completed tasks (Phase 1: Database ✅)
- In-progress tasks (Phase 2: Backend ⏳)
- Pending tasks (Phase 3: Vercel ⏳)
- Migration statistics (409 rows, 12 tables)
- Technical changes (schema conversions)
- Supabase credentials
- Troubleshooting guide

**When to Use**:
- Checking migration progress
- Understanding what's been migrated
- Accessing Supabase credentials
- Troubleshooting migration issues

---

#### `MIGRATION_NEXT_STEPS.md`
**Purpose**: Action plan for completing migration  
**Contents**:
- Files created for migration
- Repository conversion pattern
- Testing checklist
- Deployment steps
- Rollback procedures

**When to Use**:
- Continuing the migration
- Understanding next steps
- Planning deployment

---

#### `SUPABASE_VERCEL_MIGRATION.md`
**Purpose**: Detailed migration guide  
**Contents**:
- Step-by-step migration instructions
- Database schema conversion
- Backend code conversion
- Vercel deployment configuration
- Testing procedures

**When to Use**:
- Performing the migration
- Understanding migration details
- Troubleshooting migration issues

---

### Setup Documentation

#### `README.md`
**Purpose**: Basic project information  
**Contents**:
- Quick start instructions
- Technology stack
- Project structure
- Development commands
- Stage 1 features

**When to Use**:
- First-time setup
- Quick overview
- Basic commands

---

#### `SETUP.md`
**Purpose**: Detailed setup instructions  
**Contents**:
- Prerequisites
- Initial setup steps
- Environment configuration
- Service access points
- Troubleshooting

**When to Use**:
- Setting up development environment
- Troubleshooting setup issues

---

#### `QUICKSTART.md`
**Purpose**: Get running in 5 minutes  
**Contents**:
- One-command setup
- Access points
- Feature overview
- Quick testing steps

**When to Use**:
- Fastest way to get started
- Demo setup
- Quick verification

---

### Testing Documentation

#### `SHIFT_SYSTEM_TESTING.md`
**Purpose**: Shift system testing documentation  
**Contents**:
- Test coverage overview
- Manual testing procedures
- Automated test results
- Security considerations
- Recommendations

**When to Use**:
- Testing shift functionality
- Verifying rotation patterns
- Understanding test coverage

---

#### `TESTING_MIGRATION.md`
**Purpose**: Testing migration documentation  
**Contents**:
- Test migration status
- Test results
- Coverage reports

**When to Use**:
- Understanding test migration
- Checking test status

---

### Status Documentation

#### `STAGE1_COMPLETION.md`
**Purpose**: Stage 1 completion summary  
**Contents**:
- Completed features
- Test results (47/47 passing)
- Architecture overview
- Git history
- Production readiness checklist

**When to Use**:
- Understanding Stage 1 scope
- Verifying completion
- Planning Stage 2

---

#### `COMPLETE_MIGRATION_SUCCESS.md`
**Purpose**: Migration success documentation  
**Contents**:
- Migration completion status
- Success metrics
- Verification steps

**When to Use**:
- Confirming migration success
- Understanding what was migrated

---

### Other Documentation

#### `REFINEMENT_COMPLETE.md`
**Purpose**: Refinement completion status  
**Contents**:
- Refinement tasks completed
- Code improvements
- Performance optimizations

---

#### `STYLING_CONSISTENCY.md`
**Purpose**: Styling consistency documentation  
**Contents**:
- Styling standards
- Consistency guidelines
- Implementation notes

---

#### `REPOSITORY_CONVERSION_STATUS.md`
**Purpose**: Repository conversion tracking  
**Contents**:
- Repository conversion status
- Conversion checklist
- Issues and resolutions

---

#### `RUN_DATA_MIGRATION.md`
**Purpose**: Data migration quick start  
**Contents**:
- Quick migration commands
- Prerequisites
- Verification steps

---

## 🗂️ Code Documentation

### Shared Types (`shared/types/`)
- `staff.ts` - Staff member types
- `shift.ts` - Shift and assignment types
- `department.ts` - Department types
- `service.ts` - Service types
- `building.ts` - Building types
- `allocation.ts` - Allocation types
- `absence.ts` - Absence types
- `operational-hours.ts` - Operational hours types
- `config.ts` - Configuration types

### Backend Structure
```
backend/src/
├── config/          # Database configuration
├── controllers/     # HTTP request handlers (12 files)
├── repositories/    # Data access layer (13 files)
├── services/        # Business logic (2 files)
├── routes/          # API routes (13 files)
├── types/           # Backend-specific types
└── utils/           # Utility functions
```

### Frontend Structure
```
frontend/src/
├── assets/          # Styles and static assets
├── components/      # UI components (22 files)
├── composables/     # Reusable composition functions
├── router/          # Vue Router configuration
├── services/        # API client
├── stores/          # Pinia state management (4 stores)
├── utils/           # Utility functions
└── views/           # Page components (2 views)
```

---

## 🎨 Visual Documentation

### Architecture Diagrams (Rendered in Session)
1. **System Architecture** - Three-tier architecture overview
2. **Database Schema** - Entity relationship diagram
3. **Shift Scheduling Logic** - Flowchart of scheduling algorithm

---

## 🔍 Finding Information

### By Topic

**Architecture & Design**
- `CODEBASE_INDEX.md` - Section 3
- `DESIGN_SYSTEM.md`
- Architecture diagrams

**Database**
- `CODEBASE_INDEX.md` - Section 4
- `database/supabase/001_schema.sql`
- Database schema diagram

**Backend Development**
- `CODEBASE_INDEX.md` - Section 5
- `QUICK_REFERENCE.md` - Backend examples
- `backend/src/` - Source code

**Frontend Development**
- `CODEBASE_INDEX.md` - Section 6
- `QUICK_REFERENCE.md` - Frontend examples
- `frontend/src/` - Source code

**Business Logic**
- `CODEBASE_INDEX.md` - Section 7
- `backend/src/services/rota.service.ts`
- Shift scheduling flowchart

**API Reference**
- `CODEBASE_INDEX.md` - Section 8
- `backend/src/routes/` - Route definitions

**Testing**
- `SHIFT_SYSTEM_TESTING.md`
- `QUICK_REFERENCE.md` - Testing section

**Deployment**
- `MIGRATION_STATUS.md`
- `MIGRATION_NEXT_STEPS.md`
- `QUICK_REFERENCE.md` - Deployment section

---

## 📊 Documentation Statistics

- **Total Documentation Files**: 20+
- **Total Code Files**: 100+
- **Lines of Documentation**: 5,000+
- **Architecture Diagrams**: 3
- **API Endpoints Documented**: 50+
- **Database Tables Documented**: 12

---

## 🎯 Recommended Reading Order

### For New Developers
1. `README.md` (5 min)
2. `QUICKSTART.md` (5 min)
3. `CODEBASE_INDEX.md` (30 min)
4. `DESIGN_SYSTEM.md` (15 min)
5. `QUICK_REFERENCE.md` (bookmark for reference)

### For Feature Development
1. `CODEBASE_INDEX.md` - Relevant sections
2. `QUICK_REFERENCE.md` - Code examples
3. `shared/types/` - Type definitions
4. Source code in relevant area

### For Deployment
1. `MIGRATION_STATUS.md`
2. `MIGRATION_NEXT_STEPS.md`
3. `QUICK_REFERENCE.md` - Deployment section

### For Debugging
1. `QUICK_REFERENCE.md` - Debugging section
2. `CODEBASE_INDEX.md` - Architecture section
3. Source code

---

## 🔗 External Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/zqroxxjfkcmcxryuatex
- **Supabase Docs**: https://supabase.com/docs
- **Vue 3 Docs**: https://vuejs.org/
- **Pinia Docs**: https://pinia.vuejs.org/
- **Express Docs**: https://expressjs.com/

---

## 📝 Documentation Maintenance

### Keeping Documentation Updated
- Update `CODEBASE_INDEX.md` when architecture changes
- Update `QUICK_REFERENCE.md` when adding common tasks
- Update `MIGRATION_STATUS.md` as migration progresses
- Update `DESIGN_SYSTEM.md` when design changes

### Documentation Standards
- Use Markdown for all documentation
- Include code examples where relevant
- Keep examples up-to-date with actual code
- Use clear headings and structure
- Include "When to Use" sections

---

**Last Updated**: 2025-10-30  
**Maintained By**: Development Team  
**Questions?**: Refer to `CODEBASE_INDEX.md` or `QUICK_REFERENCE.md`

---

**End of Documentation Index**

