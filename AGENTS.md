# AGENTS.md

## Project Overview
AquaShow Management System (ASMS) is a web application for a water park. It supports show browsing, booking, PayOS payment, QR ticket generation, QR ticket validation, show/schedule management, user/role management, and reports.

## Tech Stack
- Frontend: ReactJS, Vite, Tailwind CSS
- Backend: Java Spring Boot, Spring Security, JWT, Spring Data JPA / Hibernate
- Database: PostgreSQL
- Cache: Redis
- Message Queue: RabbitMQ
- External services: PayOS, Gmail, Google OAuth

## Architecture
Use Layered MVC Architecture.

Backend flow:
```text
Controller -> Service -> Repository -> Entity -> PostgreSQL
```

Infrastructure:
- Redis: show/schedule cache and temporary ticket holding
- RabbitMQ: asynchronous booking processing and post-payment ticket/email tasks
- PayOS: payment link creation and callback verification
- Gmail: email notifications
- Google OAuth: Google login

## Backend Packages
- core: config, security, common response, exception, constants, shared utils
- identity: auth, user, role, JWT, Google login
- catalog: show, venue, show schedule
- booking: booking creation, history, status, Redis ticket holding
- payment: PayOS payment link, payment records, callback processing
- ticketing: QR ticket generation, view tickets, validate QR, check-in logs
- notification: email notification
- reporting: reports and statistics
- async: RabbitMQ publisher, consumer, message DTOs
- integration: PayOS, Gmail, Google OAuth clients

## Main Business Rules
- Do not put business logic in Controllers.
- Use DTOs for request and response.
- Do not expose entities directly in API responses.
- Use enums for statuses.
- Booking has at most one Payment.
- If Payment expires, Booking expires. User must create a new booking.
- Do not retry payment on an expired booking.
- Tickets are generated only after Booking is PAID.
- Each Ticket can be checked in successfully only once.
- Failed QR scan attempts should be saved in check_in_logs.
- Redis temporary ticket hold must expire automatically.
- RabbitMQ is used for booking processing and post-payment ticket/email tasks.
- Do not use RabbitMQ for show schedule management.
- Schedule management writes directly to PostgreSQL and clears Redis cache.

## Coding Rules
- Controller only receives requests and delegates to Service.
- Service contains business logic and rule validation.
- Repository only handles database access.
- Use constructor injection.
- Use GlobalExceptionHandler for API errors.
- Keep code modular by package.
- Do not introduce new tech stack unless explicitly requested.
- Before changing code, read related files in /docs.
