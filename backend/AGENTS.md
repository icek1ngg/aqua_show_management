# Backend Agent Instructions

## Scope
This file applies to the ASMS backend project.

## Tech Stack
- Java 21
- Spring Boot 3.x
- Spring Security
- JWT
- Spring Data JPA / Hibernate
- PostgreSQL
- Redis
- RabbitMQ

## Architecture
Use Layered MVC Architecture.

```text
Controller -> Service -> Repository -> Entity -> PostgreSQL
```

## Package Structure

```text
src/main/java/com/asms/
├── core/
├── identity/
├── catalog/
├── booking/
├── payment/
├── ticketing/
├── notification/
├── reporting/
├── async/
└── integration/
```

## Rules
- Do not put business logic in Controller.
- Controller receives request and delegates to Service.
- Service contains business logic.
- Repository only handles database access.
- Use DTOs for request and response.
- Do not expose Entity directly in API response.
- Use enums for status values.
- Use constructor injection.
- Do not use field injection.
- Use `@Transactional` for operations that update multiple related records.
- Use GlobalExceptionHandler for API errors.
- Keep package-by-feature structure.
- Do not introduce new technology unless explicitly requested.

## Business Rules
- Booking has at most one Payment.
- If payment expires, the booking expires.
- User must create a new booking after payment expiration.
- QR tickets are generated only after booking is `PAID`.
- Each ticket can be checked in successfully only once.
- Failed QR scan attempts should be saved in `check_in_logs`.
- Redis is used for cache and temporary ticket holding.
- RabbitMQ is used for post-payment ticket/email tasks.
- Do not use RabbitMQ for show schedule management.
- Show schedule management writes directly to PostgreSQL and clears Redis cache.

## Status Enums

### BookingStatus
```java
PENDING_PAYMENT
PAID
EXPIRED
FAILED
```

### PaymentStatus
```java
PENDING
SUCCESS
FAILED
EXPIRED
```

### TicketStatus
```java
VALID
USED
EXPIRED
```

### RoleName
```java
USER
STAFF
MANAGER
ADMIN
```

## Main Backend Feature Flow

### Create Booking
User submits booking request -> Controller delegates to BookingService -> validate rules -> Redis holds tickets -> BookingService saves booking as `PENDING_PAYMENT`.

### Payment Callback
PayOS sends callback -> PaymentCallbackController receives callback -> PaymentService verifies data -> update Payment and Booking -> clear Redis hold -> publish ticket/email task.

### Ticket Validation
Staff scans QR -> TicketController receives QR code -> CheckInService validates ticket -> update ticket to `USED` if valid -> save CheckInLog for success or failure.
