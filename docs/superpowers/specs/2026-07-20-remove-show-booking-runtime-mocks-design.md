# Remove Show and Booking Runtime Mocks

## Goal

Remove runtime mock data and mock-only execution paths for shows and bookings. After this change, show and booking behavior must use persisted backend data and real API responses.

## Scope

### Backend

- Keep the existing demo user accounts so authentication and role testing remain available.
- Stop seeding the demo show, venue, schedule, bookings, payment, and tickets.
- Remove the booking `dev-samples` endpoints, DTOs, service methods, implementation code, and security matchers.
- Do not delete Mockito-based test doubles or test fixtures.

### Frontend

- Remove the shared runtime mock-data module.
- Remove payment fallback behavior for the special `mock` booking ID.
- Remove offline ticket-validation fallback behavior and its development-only quick-fill control.
- Remove the mock PayOS checkout page and route.
- Remove the obsolete mock-validation environment variable.
- Keep API-backed show and booking pages unchanged.

## Data Flow After the Change

- Shows and schedules are returned only by backend catalog APIs backed by PostgreSQL.
- Bookings are created and queried only through the production booking and checkout APIs.
- Payment creation and ticket validation propagate API or network failures to their existing UI error handling instead of synthesizing successful mock responses.

## Existing Database Rows

Removing the seed code prevents new mock show and booking records from being created. It does not automatically delete records already present in a developer's PostgreSQL database. Direct database cleanup is outside this source-code change.

## Error Handling

No new error format is introduced. Services continue throwing API-client errors, allowing existing page-level error handling to display failures.

## Verification

- Add source-contract tests that fail while runtime mock imports, routes, flags, endpoints, and hard-coded sample identifiers still exist.
- Run the focused frontend tests, frontend build, and backend test suite.
- Search production source files to confirm that the removed mock identifiers and `dev-samples` APIs are absent while test mocks remain untouched.

## Non-Goals

- Removing demo user accounts.
- Removing or rewriting test mocks.
- Deleting existing PostgreSQL rows.
- Refactoring unrelated show, booking, payment, or ticketing behavior.
