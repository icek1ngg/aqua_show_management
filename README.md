# AquaShow Management System

## Overview

AquaShow Management System (ASMS) is a web application for a water park to manage:

- Shows
- Show schedules
- Ticket booking
- PayOS payment
- QR ticket generation
- QR ticket validation and check-in
- Users and roles
- Reports

## Current Status

The project currently includes:

- Base monorepo structure
- Backend Spring Boot base setup
- Backend health check API
- Frontend React/Vite base setup
- Frontend health check page
- Docker infrastructure for PostgreSQL, Redis, and RabbitMQ

Business modules are not implemented yet.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | ReactJS, Vite, Tailwind CSS, axios, react-router-dom |
| Backend | Java 21, Spring Boot 3.x, Spring Security, Spring Data JPA, Maven |
| Infrastructure | PostgreSQL, Redis, RabbitMQ, Docker Compose |
| Planned Integrations | PayOS, Gmail SMTP/API, Google OAuth, JWT authentication |

## Project Structure

```text
aqua_show_management/
├── docs/
├── backend/
├── frontend/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

- `docs/` contains project documentation.
- `backend/` contains the Spring Boot API.
- `frontend/` contains the React/Vite UI.
- `docker-compose.yml` starts local infrastructure services.

## Required Tools

- Java 21
- Maven
- Node.js LTS
- Docker Desktop
- Git

## Environment Files

- `.env.example` is the root template file.
- `.env` is local-only and must not be committed.
- `frontend/.env.example` is the frontend template file.
- `frontend/.env.local` is local-only and must not be committed.

## Local Infrastructure

Start local infrastructure:

```powershell
docker compose up -d
```

Check service status:

```powershell
docker compose ps
```

## Run Backend

```powershell
cd backend
mvn spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

Health API:

```text
http://localhost:8080/api/health
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Health page:

```text
http://localhost:5173/health
```

## Local Service Information

### PostgreSQL

- Host: localhost
- Port: 5432
- Database: asms_db
- Username: asms_user
- Password: asms_password

### Redis

- Host: localhost
- Port: 6379

### RabbitMQ

- Host: localhost
- AMQP Port: 5672
- Management UI: http://localhost:15672
- Username: asms_user
- Password: asms_password

## Verification

Check Docker services:

```powershell
docker compose ps
```

Check backend health:

```powershell
curl http://localhost:8080/api/health
```

Run backend tests:

```powershell
cd backend
mvn test
```

Build frontend:

```powershell
cd frontend
npm run build
```

## Notes

- Do not commit real secrets.
- Default credentials are for local development only.
- `.env` and `frontend/.env.local` are ignored by Git.
- Current implementation is base setup only.
- Business modules will be implemented in later phases.
