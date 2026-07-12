# Project Context

## System Name
AquaShow Management System (ASMS)

## Problem Description
The water park needs a web-based system to help visitors view show schedules, check ticket availability, book tickets, make payment, receive QR tickets, and check in. The system also helps managers manage shows, schedules, ticket inventory, bookings, check-ins, and reports.

## Actors
| Actor | Responsibility |
|---|---|
| Guest | View shows, register account, login with Google |
| User | Book tickets, make payment, view tickets, view booking history |
| Staff | Validate QR ticket and confirm check-in |
| Manager | Manage shows, schedules, bookings, and reports |
| Administrator | Manage users, roles, permissions |
| PayOS Gateway | Sends payment callback |
| Gmail | Sends email notifications |
| Google Authentication | Provides Google OAuth login |

## Core Business Flow
```text
Guest/User views shows
-> User selects schedule
-> User creates booking
-> System validates rules
-> Redis temporarily holds tickets
-> BookingService saves booking as PENDING_PAYMENT
-> User pays through PayOS
-> PayOS sends callback
-> System verifies callback
-> Payment and Booking are updated
-> QR tickets are generated
-> Email is sent
-> Staff validates QR ticket
```
