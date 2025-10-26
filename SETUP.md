# Staff Rota Application - Setup Guide

## Prerequisites

- Docker Desktop or Orbstack installed
- Git (for version control)

## Initial Setup

### 1. Clone and Navigate to Project

```bash
cd /Users/martin/Desktop/Yeti
```

### 2. Create Environment Files

```bash
# Root environment file
cp .env.example .env

# Backend environment file
cp backend/.env.example backend/.env

# Frontend environment file
cp frontend/.env.example frontend/.env
```

### 3. Start the Application

```bash
docker-compose up --build
```

This command will:
- Build the frontend, backend, and database containers
- Run database migrations automatically
- Seed the database with initial staff data
- Start all services

### 4. Access the Application

Once all services are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database Admin (Adminer)**: http://localhost:8080
  - System: MySQL
  - Server: mysql
  - Username: rota_user
  - Password: rota_password
  - Database: staff_rota

## Verification

### Check Services are Running

```bash
docker-compose ps
```

All services should show as "Up" or "running".

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# Get app configuration
curl http://localhost:3000/api/config/zero-date

# Get all staff
curl http://localhost:3000/api/staff

# Get rota for today
curl http://localhost:3000/api/rota/day/$(date +%Y-%m-%d)
```

### Test the Frontend

Open http://localhost:5173 in your browser. You should see:
- The Staff Rota page
- A date selector showing today's date
- Day and Night shift sections
- Staff members listed according to their schedules

## Running Tests

### Backend Tests

```bash
# Run all tests
docker-compose exec backend npm test

# Run tests in watch mode
docker-compose exec backend npm run test:watch

# Run tests with coverage
docker-compose exec backend npm run test:coverage
```

### Frontend Tests

```bash
# Run all tests
docker-compose exec frontend npm test

# Run tests in UI mode
docker-compose exec frontend npm run test:ui
```

## Development Workflow

### Making Changes

The application uses hot reload for both frontend and backend:

- **Frontend**: Changes to files in `frontend/src/` will automatically reload the browser
- **Backend**: Changes to files in `backend/src/` will automatically restart the server

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

## Database Management

### Accessing MySQL CLI

```bash
docker-compose exec mysql mysql -u rota_user -prota_password staff_rota
```

### Running Additional Migrations

If you add new migration files to `database/migrations/`, you'll need to run them manually:

```bash
docker-compose exec mysql mysql -u rota_user -prota_password staff_rota < database/migrations/new_migration.sql
```

### Resetting the Database

```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm yeti_mysql_data

# Restart (migrations will run automatically)
docker-compose up
```

## Troubleshooting

### Port Already in Use

If you get port conflict errors:

```bash
# Check what's using the port
lsof -i :5173  # Frontend
lsof -i :3000  # Backend
lsof -i :3306  # MySQL

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check MySQL is healthy
docker-compose ps mysql

# View MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up --build frontend
```

### Backend API Errors

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

## Stage 1 Features

### Implemented Functionality

1. **Date Selection**
   - Navigate to any date
   - Quick "Today" button
   - Previous/Next day navigation

2. **Shift Display**
   - Day shifts (08:00-20:00)
   - Night shifts (20:00-08:00)
   - Night shifts appear on both days they span

3. **Staff Types**
   - Regular staff (4-on-4-off pattern)
   - Supervisors (4 days / 4 off / 4 nights / 4 off)
   - Relief staff (manual assignments only)

4. **Manual Assignments**
   - Add staff to any shift on any date
   - Override calculated schedules
   - Delete manual assignments

5. **Timezone Handling**
   - All times in Europe/London timezone
   - Handles DST transitions correctly
   - 24-hour time format

### Testing the Scheduling Logic

The app uses an App Zero Date (default: 2024-01-01) as the anchor for all cycles.

**Test Regular Staff (4-on-4-off):**
- Navigate to 2024-01-01 through 2024-01-04: Staff with offset 0 should be on duty
- Navigate to 2024-01-05 through 2024-01-08: Staff with offset 0 should be off
- Navigate to 2024-01-05 through 2024-01-08: Staff with offset 4 should be on duty

**Test Supervisors:**
- Days 0-3: Day shift
- Days 4-7: Off
- Days 8-11: Night shift
- Days 12-15: Off
- Pattern repeats every 16 days

**Test Night Shift Overlap:**
- Navigate to any date where night staff are scheduled
- Check the next day - the same night staff should appear (overnight badge)

**Test Manual Assignments:**
- Use the form at the bottom of the page
- Select a Relief staff member
- Assign to Day or Night shift
- Verify they appear in the rota

## Next Steps

Stage 1 is now complete. Future stages will add:
- Authentication and user roles
- Advanced scheduling automation
- Notifications and reports
- Additional staff management features

