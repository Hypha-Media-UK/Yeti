# Staff Rota Application - Stage 1

A staff scheduling application that displays which staff members are on duty for any selected calendar day.

## Requirements

- Docker
- Orbstack (or Docker Desktop)

## Quick Start

1. Copy environment file:
```bash
cp .env.example .env
```

2. Start all services:
```bash
docker-compose up
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database Admin (Adminer): http://localhost:8080

## Technology Stack

### Frontend
- Vue 3
- TypeScript
- Pinia
- Vue Router
- Vite

### Backend
- Express.js
- MySQL 8.3+
- TypeScript

## Project Structure

```
/
├── frontend/          # Vue 3 application
├── backend/           # Express.js API
├── database/          # SQL migrations and seeds
├── shared/            # Shared TypeScript types
└── docker-compose.yml # Docker orchestration
```

## Development

All services run in Docker containers with hot reload enabled for development.

### Running Tests

Backend tests:
```bash
docker-compose exec backend npm test
```

Frontend tests:
```bash
docker-compose exec frontend npm test
```

## Stage 1 Features

- View staff on duty for any selected date
- Day shift (08:00-20:00) and Night shift (20:00-08:00) display
- Support for Regular, Supervisor, and Relief staff
- Manual assignment overrides
- Timezone-aware (Europe/London)
- Handles shifts crossing midnight
- 4-on-4-off and Supervisor rotation patterns

