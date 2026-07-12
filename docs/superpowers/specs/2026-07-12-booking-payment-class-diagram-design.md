# Booking and Payment Class Diagram Design

## Goal

Create a layered design class diagram for the ASMS booking and payment feature using the public classes, interfaces, methods, entities, enums, and dependencies implemented in the backend codebase.

## Included Classes

### Booking

- `BookingController`
- `BookingService`
- `BookingServiceImpl`
- `RedisTicketHoldService`
- `RedisTicketHoldServiceImpl`
- `BookingRepository`
- `Booking`
- `BookingStatus`

### Payment

- `PaymentController`
- `PaymentService`
- `PaymentServiceImpl`
- `PaymentRepository`
- `Payment`
- `PaymentStatus`
- `PayOsClient`
- `PaymentCompletedPublisher`

## Public Operations

- `BookingController`: `createBooking`, `getMyBookings`, `getBookingDetail`, and `getBookingByHoldId`.
- `BookingService`: `createBooking`, `getMyBookings`, `getBookingDetail`, and `getBookingByHoldId`.
- `RedisTicketHoldService`: `initializeInventory`, `holdTickets`, `releaseHold`, `getHold`, and `isHoldValid`.
- `PaymentController`: `createPayment`, `callback`, and `reconcile`.
- `PaymentService`: `createPayment`, `processCallback`, `reconcilePayment`, and `reconcilePendingPayments`.
- `PayOsClient`: `createPaymentLink`, `getPaymentStatus`, and `isValidCallback`.
- `PaymentCompletedPublisher`: `publish`.

Implementation classes show only the operations needed to establish interface realization and feature responsibilities; private helpers and constructors are omitted.

## Entity Attributes

`Booking` shows `id`, `bookingCode`, `holdId`, `showId`, `scheduleId`, `ticketType`, `quantity`, `totalAmount`, `status`, `createdAt`, and `expiresAt`.

`Payment` shows `id`, `booking`, `payosOrderCode`, `transactionId`, `amount`, `paymentLink`, `status`, `paidAt`, and `createdAt`.

## Relationships

- Controllers depend on their service interfaces.
- `BookingServiceImpl` realizes `BookingService` and depends on `BookingRepository` and `RedisTicketHoldService`.
- `RedisTicketHoldServiceImpl` realizes `RedisTicketHoldService`.
- `PaymentServiceImpl` realizes `PaymentService` and depends on `PaymentRepository`, `BookingRepository`, `RedisTicketHoldService`, `PayOsClient`, and `PaymentCompletedPublisher`.
- Repositories manage their corresponding entities.
- One `Booking` has zero or one `Payment`; every `Payment` belongs to exactly one `Booking`.
- `Booking` uses `BookingStatus`; `Payment` uses `PaymentStatus`.

## Presentation

- Use a left-to-right layered layout: Controller, Service interface/implementation, Repository/Integration, then Entity/Enum.
- Use light-blue class boxes with black borders.
- Mark interfaces, repositories, entities, components, and enumerations with stereotypes.
- Use realization arrows for implementations, dependency arrows for collaborators, and an association with multiplicities for `Booking` and `Payment`.
- Do not include DTOs, `User`, `ShowSchedule`, `TicketGenerationService`, private helpers, constructors, or getter/setter methods.

## Verification

- Confirm every displayed public operation exists in the codebase.
- Confirm implementation dependencies match constructor fields in `BookingServiceImpl` and `PaymentServiceImpl`.
- Confirm the `Booking`–`Payment` multiplicity matches the one-to-one unique foreign key in `Payment`.
- Confirm matching `@startuml` and `@enduml` directives.
