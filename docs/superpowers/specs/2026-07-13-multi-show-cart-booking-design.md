# Multi-Show Cart and Booking Design

## Objective

Replace the current single-schedule booking preview with a user cart that can contain ticket selections from multiple shows and schedules, create one booking containing multiple line items, and continue to one PayOS payment. Remove fixed booking data and fixed ticket prices, introduce ticket-type inventory per schedule, and show availability after active Redis holds.

## Confirmed Business Decisions

- Users select the schedule, ticket type, and quantity from `/shows` before opening the cart.
- A cart can contain tickets from different shows and schedules.
- A cart line is uniquely identified by `scheduleId + ticketType`.
- The cart is stored in `localStorage` and survives refresh and login navigation.
- The user can select a subset of cart lines for checkout; unselected lines stay in the cart.
- One checkout creates one `Booking` with multiple `BookingItem` records and one PayOS payment.
- A schedule stores one Standard base price. Ticket prices are calculated as:
  - Standard: base price x 1.0
  - VIP: base price x 2.5
  - Family: base price x 1.5
- A Manager enters separate Standard, VIP, and Family capacities for each schedule. Their sum must not exceed the selected venue capacity.
- Existing schedules migrate their current capacity and availability to Standard. VIP and Family start at zero until a Manager edits the schedule.
- New and changed user-facing copy is English only.
- Currency is displayed with a period as the thousands separator and the `VND` suffix, for example `2.500 VND`.
- The shared cart icon and quantity badge appear only in visitor/user navigation, including desktop and mobile. Staff, Manager, and Admin workspaces do not show the cart.
- The checkout stepper contains only `01 Cart` and `02 Payment`. There is no Additional Services step.
- RabbitMQ remains limited to post-payment ticket and email work.

## Domain Model

### ShowSchedule

`ShowSchedule` becomes the persistent source of ticket capacity and Standard base price for a performance. It stores:

- `standardCapacity`, `vipCapacity`, `familyCapacity`
- `standardAvailableTickets`, `vipAvailableTickets`, `familyAvailableTickets`
- `standardPrice`

The total configured capacity is derived from the three ticket-type capacities. The backend rejects create or update requests when any capacity is negative, the total is zero, or the total exceeds the venue capacity. Available counts cannot be greater than their matching capacities or less than zero.

`standardPrice` must be positive. VIP and Family prices are derived and are never accepted from the client or stored as independent schedule prices.

### Booking

`Booking` becomes the order-level aggregate. It stores the user, booking code, total amount, status, creation time, expiration time, and its collection of items. It no longer represents one schedule and ticket type directly.

One Booking has zero or one Payment. Booking status continues to represent the lifecycle of the entire order: `PENDING_PAYMENT`, `PAID`, `EXPIRED`, or `FAILED`.

### BookingItem

Each `BookingItem` represents one cart line and stores:

- Booking reference
- Schedule ID and Show ID
- Ticket type
- Quantity
- Unit price and line total
- Redis hold ID
- Snapshots of show title, show image URL, schedule start/end time, venue name, and Standard base price

Snapshots make booking history stable when catalog data changes later. Ticket generation uses BookingItems so the number and type of tickets match the paid order.

## Pricing

Pricing is a backend-owned business rule. A focused pricing component receives `standardPrice` and normalized ticket type and returns the unit price using `BigDecimal`:

| Ticket type | Multiplier |
|---|---:|
| STANDARD | 1.0 |
| VIP | 2.5 |
| FAMILY | 1.5 |

The component rejects unknown ticket types. Unit and line totals use scale 2 consistently for persistence and PayOS. The frontend may calculate previews with the same published multipliers, but checkout always uses the backend result.

## Redis Inventory and Holds

Redis inventory and holds are isolated by schedule and ticket type. Keys include both values, for example:

```text
booking:inventory:{scheduleId}:STANDARD
booking:inventory:{scheduleId}:VIP
booking:inventory:{scheduleId}:FAMILY
booking:hold:{holdId}
booking:active-holds:{scheduleId}:{ticketType}
```

The inventory value is initialized from the matching PostgreSQL available count. Active holds are tracked individually with their expiration time instead of relying on one aggregate counter whose TTL is reset by later holds.

Before reading availability or creating a hold, the Redis operation removes expired active-hold entries. A Lua script calculates active held quantity and atomically rejects or creates the requested hold. Effective availability is:

```text
max(0, persistent available tickets - active Redis-held tickets)
```

Public schedule DTOs return effective availability for Standard, VIP, and Family. The `/shows` selector, cart validation, and Manager availability display use these values. When two Standard tickets are held from an inventory of 100, public UI displays 98.

Each BookingItem owns one hold ID. Multi-line checkout acquires holds in a deterministic order. If any hold or database operation fails, the service releases every hold acquired for that attempt and does not persist a partial Booking.

On payment success, the backend locks affected schedule records, validates the holds, decrements the matching PostgreSQL available counts, marks the Booking paid, and releases/removes the holds. The PayOS callback is idempotent and cannot decrement inventory or publish post-payment work twice. Expired or failed bookings release all remaining holds.

## API Design

### Public schedule details

`GET /api/schedules/{scheduleId}` returns a booking-ready schedule response containing:

- Schedule ID and status
- Show ID, title, description, and image URL
- Start and end time
- Venue name
- Standard base price
- Standard, VIP, and Family configured capacities
- Standard, VIP, and Family effective availability
- Derived Standard, VIP, and Family unit prices

The response is authoritative for `/shows` and cart refresh. URL parameters and `localStorage` display snapshots are not trusted.

### Create or update schedule

Manager schedule requests accept `standardCapacity`, `vipCapacity`, `familyCapacity`, and `standardPrice`. The old generic capacity and price inputs are removed from the UI. The backend derives total capacity and applies venue-capacity validation.

### Create booking

The create request contains an `items` array. Each item contains only:

- `scheduleId`
- `ticketType`
- `quantity`

The backend normalizes duplicate schedule/type pairs, rejects invalid or inactive schedules, validates quantities, recalculates price, checks effective availability, and creates the Booking aggregate. The response contains the booking ID, booking code, status, total amount, expiration time, and normalized item summaries.

The request does not accept show name, show date, venue, or price.

### Booking and payment responses

Booking history, booking detail, Manager booking detail, and payment responses return an item list and order-level total. Payment creation accepts one Booking ID and creates one PayOS order for its total.

## Frontend Cart State

A shared `CartContext` owns cart state for all visitor/user routes. It reads and writes one versioned `localStorage` value. Each stored line contains the authoritative identifiers and quantity plus optional display snapshots for immediate rendering:

- `scheduleId`
- `showId`
- `ticketType`
- `quantity`
- Optional show title, image, schedule times, venue, and preview unit price

Adding the same `scheduleId + ticketType` merges quantities. Quantity remains between 1 and 10 and cannot knowingly exceed the latest effective availability. The backend still performs the final check.

The shared Navbar consumes `CartContext`. Desktop and mobile render the same total-ticket badge and route to `/bookings/create`. The badge and cart action are hidden for Staff and are absent from the separate Manager and Admin layouts.

## `/shows` Ticket Selection

Show cards and schedules expose a `Select Tickets` action. The selector stays on `/shows` and provides:

- Active schedule choice
- Standard, VIP, and Family ticket rows
- Derived price in `2.500 VND` format
- Effective availability per type
- Quantity controls
- `Add to Cart` action

Zero-inventory types are disabled. A successful add updates the Navbar badge immediately and gives clear feedback without navigating away. The user may continue browsing other shows or open the cart.

## `/bookings/create` Cart Page

The attached HTML provides the visual direction for the cart content, but the implementation reuses the existing `MainLayout`, `Navbar`, `Footer`, AquaPulse colors, typography, routing, and authentication behavior. It does not copy VinWonders, VPoints, promotions, newsletter, or unrelated links.

The page contains a two-step indicator: `01 Cart` is active and `02 Payment` is inactive.

The main column renders one card per cart line with:

- Checkout checkbox
- Show image and title
- Schedule date, start/end time, and venue
- Ticket type, quantity, unit price, and line total
- Quantity edit control
- Show detail link
- Remove action

The sticky order summary includes selected line count, selected ticket count, total amount, availability warning, and `Continue to Payment`. Only selected lines are included. The button is disabled when nothing is selected, validation is running, or checkout is being submitted.

On page load and before checkout, the page refreshes every cart line from the schedule API. If price or availability changed, it updates the preview, highlights the affected line, and requires the user to review the new values. Missing, inactive, or sold-out schedules cannot be selected for checkout.

Unauthenticated users keep their cart and are sent to login with a return location. After login they return to the cart. After Booking creation succeeds, selected lines are removed and unselected lines remain. The user is then routed to the existing payment experience adapted for a multi-item Booking.

The empty state links back to `/shows`. Mobile layout places the order summary below the item list.

## Shared Copy and Currency

All new or modified user-facing copy is English. A single shared formatter displays integer VND values with `.` as the thousands separator and the literal ` VND` suffix. Examples:

- `2.500 VND`
- `15.000 VND`
- `1.250.000 VND`

The formatter replaces inconsistent `₫`, `đ`, dollar, comma-separated, and locale-dependent booking displays across show selection, cart, booking detail/history, Manager booking view, and payment pages touched by this feature.

## Migration and Compatibility

Database migration preserves existing data:

- Existing schedule `capacity` becomes `standardCapacity`.
- Existing `availableTickets` becomes `standardAvailableTickets`.
- Existing `price` becomes `standardPrice`.
- VIP and Family capacity/availability start at zero.
- Each existing Booking is converted to an order with one BookingItem carrying its previous schedule, type, quantity, price, and available snapshot data.
- Existing Payment remains linked to its migrated Booking.

The migration is deterministic and does not invent VIP or Family inventory for existing schedules.

## Error Handling

- Invalid cart line: return field/item-specific validation errors.
- Inactive or missing schedule: mark that line unavailable without deleting it automatically.
- Insufficient inventory: return schedule ID, ticket type, requested quantity, and latest effective availability.
- Price change: backend response returns authoritative item prices; frontend requires review before a new submit.
- Redis unavailable: return service unavailable and create no Booking.
- Partial Redis hold failure: release all holds acquired by the request.
- Database failure after holds: release all holds.
- Duplicate checkout click: frontend disables submission; backend uses an idempotency key for retry safety.
- Repeated PayOS callback: return the existing successful result without a second inventory decrement or duplicate RabbitMQ publication.

## Testing Strategy

Backend unit and service tests cover ticket multipliers, schedule capacity validation, DTO mapping, per-type Redis keys, effective availability, expired-hold cleanup, multi-item hold rollback, aggregate totals, migration-compatible responses, booking expiration, payment idempotency, and inventory decrement per item.

Frontend pure state and utility tests cover cart merge/remove/update behavior, selected totals, versioned persistence, role visibility, and `2.500 VND` formatting. Component/build verification covers loading, empty, unavailable, changed-price, insufficient-inventory, and submitting states.

End-to-end verification covers:

1. Manager creates schedules with Standard, VIP, and Family capacities.
2. User selects different ticket types from multiple shows on `/shows`.
3. Navbar badge stays synchronized across user pages and refresh.
4. Cart checkboxes control the selected checkout subset.
5. Active Redis holds reduce public availability for the matching type only.
6. Continue creates one Booking with multiple BookingItems.
7. Payment page shows the combined total and all items.
8. Testing stops before external PayOS payment unless payment callback behavior is being tested in an isolated automated test.

## Non-Goals

- Promotions, VPoints, additional services, newsletter subscription, and guest checkout are not introduced.
- Staff, Manager, and Admin navigation do not expose the user cart.
- Ticket-type multipliers are not configurable through the UI in this scope.
- RabbitMQ is not used during schedule management or booking creation.
