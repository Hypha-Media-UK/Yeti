# Staff Rota Application - Quick Start

## One-Command Setup

```bash
# 1. Create environment files
cp .env.example .env && cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env

# 2. Start everything
docker-compose up --build
```

Wait for all services to start (about 1-2 minutes on first run).

## Access the Application

Open your browser to: **http://localhost:5173**

## What You'll See

1. **Staff Rota** page with today's date
2. **Day Shift** section (08:00-20:00) with scheduled staff
3. **Night Shift** section (20:00-08:00) with scheduled staff
4. **Manual Assignment Form** to add staff to shifts

## Try These Features

### Navigate Dates
- Click the **← →** arrows to move between days
- Click **Today** to return to current date
- Click the date display to pick any date

### View Different Patterns
- **2024-01-01 to 01-04**: Regular Day staff (offset 0) are on duty
- **2024-01-05 to 01-08**: Regular Day staff (offset 4) are on duty
- **2024-01-01 to 01-04**: Supervisors on Day shift
- **2024-01-09 to 01-12**: Supervisors on Night shift

### Add Manual Assignment
1. Scroll to "Add Manual Assignment" form
2. Select a Relief staff member (e.g., "Daniel Lee")
3. Choose Day or Night shift
4. Click "Add Assignment"
5. Staff appears in the selected shift

### Observe Night Shift Overlap
1. Navigate to a date with Night staff (e.g., 2024-01-01)
2. Note the Night shift staff
3. Click **→** to go to next day
4. Same Night staff appear with "Overnight" badge

## Verify Everything Works

Run the verification script:

```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

This checks:
- ✓ Docker is running
- ✓ All services are up
- ✓ API endpoints respond
- ✓ Database is populated
- ✓ Frontend is accessible

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart application
docker-compose restart

# Run backend tests
docker-compose exec backend npm test

# Access database
docker-compose exec mysql mysql -u rota_user -prota_password staff_rota
```

## Troubleshooting

**Services won't start?**
```bash
docker-compose down -v
docker-compose up --build
```

**Port conflicts?**
```bash
# Check what's using ports
lsof -i :5173  # Frontend
lsof -i :3000  # Backend
lsof -i :3306  # MySQL
```

**Database issues?**
```bash
# Reset database
docker-compose down -v
docker-compose up
```

## Next Steps

- Read [SETUP.md](SETUP.md) for detailed documentation
- Explore the API at http://localhost:3000/api
- View database in Adminer at http://localhost:8080
- Check [README.md](README.md) for architecture details

## Stage 1 Acceptance Criteria ✓

- [x] Day View shows both Day and Night shifts for selected date
- [x] Night shifts appear on both calendar days they overlap
- [x] Manual assignments override calculated cycles
- [x] Times displayed in 24-hour format
- [x] Week starts Monday
- [x] Application runs locally with Docker/Orbstack
- [x] Tests covering cycle logic, overlap, and DST pass
- [x] Handles Regular (4-on-4-off) and Supervisor patterns
- [x] Supports Days Offset for staggered rotations
- [x] Relief staff only appear via manual assignments
- [x] All calculations use Europe/London timezone

