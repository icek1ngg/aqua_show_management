# Implementation Plan

## Phase 1: Project Setup
Backend:
- Create Spring Boot project
- Configure PostgreSQL, Redis, RabbitMQ
- Configure common response and exception handling
- Configure validation
- Configure security base

Frontend:
- Create React + Vite project
- Configure Tailwind CSS
- Configure routing and API service layer

## Phase 2: Identity and Security
- Role entity and RoleName enum
- User entity, UserStatus, AuthProvider
- Register/login
- Password encryption
- JWT provider and filter
- Role-based authorization
- Google OAuth login if time allows

## Phase 3: Catalog
- Show CRUD
- Venue CRUD
- ShowSchedule CRUD
- Show list and detail
- Schedule validation rules
- Redis cache for show/schedule if needed

## Phase 4: Booking
- Create booking API
- Validate schedule, quantity, ticket limit, cut-off time
- Redis temporary ticket holding
- RabbitMQ booking message
- BookingConsumer saves PENDING_PAYMENT booking

## Phase 5: Payment
- Create PayOS payment link
- Save Payment PENDING
- Process PayOS callback
- Verify callback
- Update Payment and Booking status
- Clear Redis hold
- Publish ticket/email task

## Phase 6: Ticketing and Check-in
- Generate QR tickets after payment success
- View My Tickets
- Validate QR ticket
- Update Ticket to USED
- Save CheckInLog for success and failure

## Phase 7: Notification
- Gmail client
- EmailNotification entity
- Registration email
- Payment success email
- QR ticket email

## Phase 8: Management and Reports
- Manage bookings
- Manage users and roles
- Booking reports
- Ticket sales reports
- Attendance and check-in reports

## Recommended Order
```text
1. Backend foundation
2. Identity
3. Catalog
4. Booking
5. Payment
6. Ticketing
7. Notification
8. Reports
9. Frontend pages for completed APIs
```
