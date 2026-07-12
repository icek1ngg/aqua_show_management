# Validate QR Ticket Sequence Diagram Design

## Goal

Create a concise PlantUML sequence diagram for the UC-13 Validate QR Ticket report section. The diagram must reflect the implemented validation flow without exposing low-level frontend scanning mechanics or every individual response code.

## Scope

The diagram includes these participants:

- Staff
- StaffTicketValidationPage
- TicketValidationController
- TicketValidationServiceImpl
- TicketRepository
- CheckInLogRepository

The diagram excludes camera initialization, QR decoding libraries, HTTP authentication internals, DTO construction details, and frontend cooldown state.

## Main Interaction

1. Staff scans or enters a QR ticket.
2. The validation page submits the QR code to the controller.
3. The controller delegates validation to the service.
4. The service queries the ticket and its booking.
5. The service follows one of three report-level outcomes:
   - Invalid ticket: save or reuse a failure log and deny entry.
   - Valid ticket: atomically update the ticket from `VALID` to `USED`, save a success log, and allow entry.
   - Concurrent or duplicate scan: save or reuse an `ALREADY_USED` failure log and deny entry.
6. The result returns through the controller to the validation page and is shown to Staff.

## Presentation

- Use PlantUML sequence-diagram notation with activation bars and an `alt` block.
- Use numbered messages suitable for an academic software-design report.
- Use the project's existing light-blue participant style.
- Keep labels short and in English to match the surrounding report.
- Title the diagram `Validate QR Ticket`.

## Verification

- Confirm that the PlantUML source contains matching `@startuml` and `@enduml` directives.
- Render the source when a local PlantUML runtime is available.
- Confirm the rendered diagram is readable and contains all six participants and all three outcome branches.
