#!/bin/bash

# Staff Rota Application - Setup Verification Script

set -e

echo "========================================="
echo "Staff Rota Application - Setup Verification"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    
    if docker-compose ps | grep -q "$service.*Up"; then
        print_status 0 "$service is running"
        
        # Check if port is accessible
        if nc -z localhost $port 2>/dev/null; then
            print_status 0 "$service is accessible on port $port"
        else
            print_status 1 "$service port $port is not accessible"
        fi
    else
        print_status 1 "$service is not running"
    fi
}

# Check Docker is running
echo "Checking prerequisites..."
if command -v docker &> /dev/null; then
    print_status 0 "Docker is installed"
else
    print_status 1 "Docker is not installed"
    exit 1
fi

if docker info &> /dev/null; then
    print_status 0 "Docker daemon is running"
else
    print_status 1 "Docker daemon is not running"
    exit 1
fi

echo ""
echo "Checking environment files..."

# Check environment files exist
if [ -f .env ]; then
    print_status 0 "Root .env file exists"
else
    print_status 1 "Root .env file missing (run: cp .env.example .env)"
fi

if [ -f backend/.env ]; then
    print_status 0 "Backend .env file exists"
else
    print_status 1 "Backend .env file missing (run: cp backend/.env.example backend/.env)"
fi

if [ -f frontend/.env ]; then
    print_status 0 "Frontend .env file exists"
else
    print_status 1 "Frontend .env file missing (run: cp frontend/.env.example frontend/.env)"
fi

echo ""
echo "Checking Docker services..."

# Check if services are running
check_service "mysql" 3306
check_service "backend" 3000
check_service "frontend" 5173

echo ""
echo "Testing API endpoints..."

# Test health endpoint
if curl -s http://localhost:3000/health | grep -q "ok"; then
    print_status 0 "Backend health check passed"
else
    print_status 1 "Backend health check failed"
fi

# Test config endpoint
if curl -s http://localhost:3000/api/config/zero-date | grep -q "appZeroDate"; then
    print_status 0 "Config API endpoint working"
else
    print_status 1 "Config API endpoint failed"
fi

# Test staff endpoint
if curl -s http://localhost:3000/api/staff | grep -q "staff"; then
    print_status 0 "Staff API endpoint working"
else
    print_status 1 "Staff API endpoint failed"
fi

# Test rota endpoint
TODAY=$(date +%Y-%m-%d)
if curl -s "http://localhost:3000/api/rota/day/$TODAY" | grep -q "dayShifts"; then
    print_status 0 "Rota API endpoint working"
else
    print_status 1 "Rota API endpoint failed"
fi

echo ""
echo "Testing frontend..."

# Test frontend is serving
if curl -s http://localhost:5173 | grep -q "Staff Rota"; then
    print_status 0 "Frontend is serving correctly"
else
    print_status 1 "Frontend is not serving correctly"
fi

echo ""
echo "Database verification..."

# Check database has tables
TABLES=$(docker-compose exec -T mysql mysql -u rota_user -prota_password staff_rota -e "SHOW TABLES;" 2>/dev/null | wc -l)
if [ $TABLES -gt 4 ]; then
    print_status 0 "Database tables created"
else
    print_status 1 "Database tables missing"
fi

# Check staff data exists
STAFF_COUNT=$(docker-compose exec -T mysql mysql -u rota_user -prota_password staff_rota -e "SELECT COUNT(*) FROM staff;" 2>/dev/null | tail -n 1)
if [ "$STAFF_COUNT" -gt 0 ]; then
    print_status 0 "Staff data seeded ($STAFF_COUNT staff members)"
else
    print_status 1 "No staff data found"
fi

echo ""
echo "========================================="
echo "Verification Complete"
echo "========================================="
echo ""
echo "Access the application:"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3000"
echo "  Adminer:   http://localhost:8080"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Run tests:"
echo "  docker-compose exec backend npm test"
echo "  docker-compose exec frontend npm test"
echo ""

