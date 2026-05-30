# Business Rules

## Booking Rules
- User must be authenticated to create a booking.
- Requested ticket quantity must be greater than 0.
- Maximum 10 tickets per booking.
- Users cannot book more tickets than available quantity.
- Tickets cannot be booked for shows that start within 30 minutes.
- Redis temporarily holds tickets during booking.
- Expired Redis holds release tickets automatically.
- Booking status: PENDING_PAYMENT, PAID, EXPIRED, FAILED.

## Payment Rules
- Booking must be PENDING_PAYMENT before payment.
- A booking has at most one payment.
- Payment status: PENDING, SUCCESS, FAILED, EXPIRED.
- PayOS callback must be verified before updating payment or booking status.
- If payment succeeds, booking becomes PAID.
- If payment fails, booking becomes FAILED.
- If payment expires, booking becomes EXPIRED.
- If payment expires, user must create a new booking.
- Do not retry payment on expired booking.

## Ticket Rules
- QR tickets are generated only after booking is PAID.
- Ticket status: VALID, USED, EXPIRED.
- Each QR ticket can be used successfully only once.
- Failed QR validation attempts should be saved in check_in_logs.
- A ticket can have many check-in logs, but only one successful check-in.

## Schedule Rules
- Schedule capacity must not exceed venue capacity.
- Two schedules cannot use the same venue at overlapping time slots.
- Managers must create schedules at least 24 hours before show start time.
- Deactivate schedule is not allowed if paid bookings exist.
- Schedule management writes directly to PostgreSQL.
- Schedule management clears related Redis cache.
- Do not use RabbitMQ for show schedule management.

## Role Rules
- USER can book tickets, pay, view tickets, and view booking history.
- STAFF can validate QR tickets.
- MANAGER can manage shows, schedules, bookings, and reports.
- ADMIN can manage users and roles.

## Notification Rules
- Send email after successful registration when possible.
- Send payment success and QR ticket email after successful payment.
- Email failure must be logged and should not roll back successful booking/payment.
