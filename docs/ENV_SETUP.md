# Environment Setup

## Required Tools
- Java 21+
- Maven or Gradle
- Node.js 18+
- PostgreSQL
- Redis
- RabbitMQ
- Git

## External Accounts
- PayOS account
- Gmail SMTP/API credentials
- Google OAuth credentials

## Backend Environment Variables
```env
DB_URL=jdbc:postgresql://localhost:5432/asms
DB_USERNAME=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

JWT_SECRET=change-this-secret
JWT_EXPIRATION=86400000

PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

GMAIL_USERNAME=
GMAIL_APP_PASSWORD=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
```

## Frontend Environment Variables
Create `frontend/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Local Ports
| Service | Port |
|---|---|
| Frontend | 5173 |
| Backend | 8080 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| RabbitMQ | 5672 |
| RabbitMQ Management | 15672 |

## Running Order
1. Start PostgreSQL
2. Start Redis
3. Start RabbitMQ
4. Run backend
5. Run frontend

## Commands
Backend:
```bash
cd backend
mvn spring-boot:run
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Notes
- Do not commit real .env files.
- Commit only .env.example.
- Keep secrets outside Git.
