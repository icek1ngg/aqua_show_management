# API Specification

## General Rules
- API style: REST
- Format: JSON
- Protected APIs use JWT Bearer token
- Use DTOs for request and response
- Do not expose entities directly

## Common Response
```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

## Auth
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
POST /api/auth/logout
GET  /api/users/profile
PUT  /api/users/profile
```

## Public Shows
```http
GET /api/shows
GET /api/shows/{id}
GET /api/shows/{id}/schedules
GET /api/schedules/{id}
```

## Manager Shows and Schedules
```http
POST  /api/manager/shows
PUT   /api/manager/shows/{id}
PATCH /api/manager/shows/{id}/deactivate
GET   /api/manager/shows

POST  /api/manager/venues
PUT   /api/manager/venues/{id}
PATCH /api/manager/venues/{id}/deactivate
GET   /api/manager/venues

POST  /api/manager/schedules
PUT   /api/manager/schedules/{id}
PATCH /api/manager/schedules/{id}/deactivate
GET   /api/manager/schedules
GET   /api/manager/schedules/{id}
```

## Booking
```http
POST /api/bookings
GET  /api/bookings/my-history
```

Create booking request:
```json
{
  "scheduleId": "uuid",
  "quantity": 2
}
```

Expected flow:
```text
Validate request -> Redis hold -> RabbitMQ publish -> BookingConsumer saves PENDING_PAYMENT booking
```

## Payment
```http
POST /api/payments/create
POST /api/payments/callback
```

Create payment request:
```json
{
  "bookingId": "uuid"
}
```

## Ticketing
```http
GET  /api/tickets/my
POST /api/tickets/validate
```

Validate QR request:
```json
{
  "qrCode": "qr-code-data"
}
```

## Manager Booking and Reports
```http
GET /api/manager/bookings
GET /api/manager/bookings/{id}
GET /api/manager/reports/bookings
GET /api/manager/reports/ticket-sales
GET /api/manager/reports/attendance
GET /api/manager/reports/check-ins
```

## Admin
```http
GET   /api/admin/users
GET   /api/admin/users/{id}
PUT   /api/admin/users/{id}
PATCH /api/admin/users/{id}/disable
PATCH /api/admin/users/{id}/enable
GET   /api/admin/roles
PUT   /api/admin/users/{id}/role
```
