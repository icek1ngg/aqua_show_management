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
GET /api/schedules/upcoming
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
POST /api/checkout/start-payment
GET  /api/bookings/my
GET  /api/bookings/{id}
```

Start checkout and create payment request:
```json
{
  "idempotencyKey": "client-generated-key",
  "items": [
    {
      "scheduleId": "uuid",
      "ticketType": "STANDARD",
      "passengerType": "ADULT",
      "quantity": 2,
      "expectedUnitPrice": 100000
    }
  ]
}
```

Expected flow:
```text
Validate and normalize request -> Redis hold -> save PENDING_PAYMENT booking -> create PayOS session
```

The checkout may contain at most 10 tickets in total. `POST /api/bookings` is not a
production creation endpoint; checkout is the only supported production path.

The booking row is committed before calling PayOS, so the booking transaction does
not stay open during the remote request. A PayOS setup failure marks the booking
`FAILED` and releases its Redis holds.

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
