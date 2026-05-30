# Database Schema

## Main Tables
- roles
- users
- shows
- venues
- show_schedules
- bookings
- payments
- tickets
- check_in_logs
- email_notifications

## Relationships
```text
roles 1 - n users
users 1 - n bookings
users 1 - n check_in_logs
users 1 - n email_notifications
shows 1 - n show_schedules
venues 1 - n show_schedules
show_schedules 1 - n bookings
show_schedules 1 - n tickets
bookings 1 - 0..1 payments
bookings 1 - n tickets
bookings 1 - n email_notifications
tickets 1 - n check_in_logs
```

## Important Notes
- One Booking has at most one Payment.
- If Payment expires, Booking expires.
- A Ticket can have many CheckInLogs because failed scan attempts are recorded.
- A Ticket can have only one successful check-in.

## Core Table Columns

### roles
- id: UUID PK
- name: VARCHAR(50) UNIQUE
- description: VARCHAR(255)

### users
- id: UUID PK
- role_id: UUID FK
- last_name: VARCHAR(100)
- first_middle_name: VARCHAR(150)
- gender: VARCHAR(20)
- email: VARCHAR(150) UNIQUE
- phone_number: VARCHAR(20)
- address: VARCHAR(255)
- password_hash: VARCHAR(255)
- google_id: VARCHAR(150)
- auth_provider: VARCHAR(20)
- status: VARCHAR(20)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### shows
- id: UUID PK
- title: VARCHAR(150)
- description: TEXT
- image_url: VARCHAR(255)
- duration_minutes: INT
- status: VARCHAR(20)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### venues
- id: UUID PK
- name: VARCHAR(150)
- location: VARCHAR(255)
- capacity: INT
- status: VARCHAR(20)

### show_schedules
- id: UUID PK
- show_id: UUID FK
- venue_id: UUID FK
- start_time: TIMESTAMP
- end_time: TIMESTAMP
- capacity: INT
- available_tickets: INT
- price: DECIMAL(12,2)
- status: VARCHAR(20)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### bookings
- id: UUID PK
- user_id: UUID FK
- schedule_id: UUID FK
- total_quantity: INT
- total_amount: DECIMAL(12,2)
- status: VARCHAR(30)
- created_at: TIMESTAMP
- expired_at: TIMESTAMP

### payments
- id: UUID PK
- booking_id: UUID FK UNIQUE
- payos_order_code: VARCHAR(100) UNIQUE
- transaction_id: VARCHAR(150)
- amount: DECIMAL(12,2)
- payment_link: VARCHAR(500)
- status: VARCHAR(30)
- paid_at: TIMESTAMP
- created_at: TIMESTAMP

### tickets
- id: UUID PK
- booking_id: UUID FK
- schedule_id: UUID FK
- qr_code: VARCHAR(500) UNIQUE
- status: VARCHAR(20)
- issued_at: TIMESTAMP
- used_at: TIMESTAMP

### check_in_logs
- id: UUID PK
- ticket_id: UUID FK
- staff_id: UUID FK
- check_in_time: TIMESTAMP
- result: VARCHAR(30)
- failure_reason: VARCHAR(255)

### email_notifications
- id: UUID PK
- user_id: UUID FK
- booking_id: UUID FK
- email_type: VARCHAR(50)
- recipient_email: VARCHAR(150)
- subject: VARCHAR(255)
- status: VARCHAR(30)
- sent_at: TIMESTAMP
- created_at: TIMESTAMP

## Enums
```java
BookingStatus: PENDING_PAYMENT, PAID, EXPIRED, FAILED
PaymentStatus: PENDING, SUCCESS, FAILED, EXPIRED
TicketStatus: VALID, USED, EXPIRED
UserStatus: ACTIVE, INACTIVE, DISABLED
AuthProvider: LOCAL, GOOGLE
RoleName: USER, STAFF, MANAGER, ADMIN
CommonStatus: ACTIVE, INACTIVE
```
