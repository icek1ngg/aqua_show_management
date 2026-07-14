# Inline Show Ticket Selection Design

## Objective

Replace every separate ticket-selection modal or drawer with one inline ticket-selection workspace on `/shows`. Book Now, Book Tickets, ticket search, and show-specific booking actions route users to this workspace. Users choose a schedule and ticket types on the left, review and adjust quantities on the right, add the selected tickets to the existing cart, and continue to `/bookings/create`.

## Confirmed Visual Direction

- Keep the AquaPulse cyan–teal palette for Calendar, Select, quantity, and Add to Cart actions.
- Do not use orange for selection controls, borders, or calls to action in this workspace.
- Display ticket types vertically on the left.
- Display Selected Tickets as a sticky summary panel on the right for desktop layouts.
- Remove the `Selected Time` badge.
- Place `View Calendar` in the schedule header where `Selected Time` previously appeared.
- On mobile, stack the summary below the schedule and ticket-type list.

## Route and Entry-Point Behavior

`/shows` is the only public ticket-selection surface. `/public/shows` continues to render the same experience for compatibility.

The application removes the standalone `TicketSelector` modal and the ticket-search drawer. Live user-facing Book Now, Book Tickets, and ticket-search actions navigate to `/shows` and scroll to the ticket workspace. Actions with a known show or schedule pass those identifiers in navigation state so the workspace can preselect them. Generic actions open `/shows` without identifiers and use the default selection rules below.

Show detail remains available for reading show information, but its booking action routes back to `/shows` with the current show and preferred schedule instead of rendering a ticket selector on the detail page.

## Default Show and Schedule Selection

Navigation state has first priority:

1. Use the requested active show when its identifier exists in the loaded show list.
2. Use the requested schedule when it belongs to that show and remains bookable.
3. Otherwise choose the requested show's earliest future schedule with availability.

Without navigation state, choose the earliest future schedule across the loaded active shows that has availability in at least one ticket type. A schedule is bookable when its start time is more than 30 minutes in the future and at least one of `standardAvailableTickets`, `vipAvailableTickets`, or `familyAvailableTickets` is greater than zero.

The Upcoming Times date heading reflects the selected schedule. If no bookable schedule exists, the workspace shows an empty state and disables ticket selection.

## Left-Side Selection Workspace

The selected schedule header displays:

- start and end time;
- venue name;
- total remaining availability derived from the three ticket-type availability values;
- `View Calendar` in the right side of the header.

`View Calendar` expands an inline list of the selected show's bookable dates and times below the schedule header. Choosing another entry updates the header and clears only the uncommitted Selected Tickets summary. It does not open a modal or navigate away from `/shows`.

Below the header, render one vertical row each for Standard Entry, VIP Entry, and Family Package. Each row displays the authoritative unit price, availability for that ticket type, and a Select action.

Selecting a ticket type adds it to the right-side summary with quantity `1`. A selected row changes its action to a non-orange cyan–teal selected state. A sold-out ticket type is disabled independently and cannot be added.

Changing the selected show or schedule clears the uncommitted summary. Tickets already added to the persistent cart are not affected.

## Selected Tickets Summary

The right-side summary displays the selected show, schedule time, venue, and one line per selected ticket type. Each line contains:

- ticket-type name;
- unit price;
- current quantity;
- decrement and increment controls;
- calculated line total.

Quantity changes happen only in this panel. Increment is capped at the smaller of the ticket type's authoritative availability and the existing cart maximum of 10 tickets per line. Decrementing from `1` to `0` removes the line and restores the left-side Select action.

The panel displays total ticket quantity and a temporary total calculated from all selected lines. `Add to Cart & Continue` is disabled while the summary is empty.

## Cart and Checkout Data Flow

The workspace uses the existing `CartContext` and cart storage helpers. Pressing `Add to Cart & Continue`:

1. converts every summary line into the existing cart item shape;
2. merges each line by `scheduleId + ticketType` using existing cart rules;
3. preserves authoritative identifiers, show and schedule display snapshots, unit price, and quantity;
4. navigates to `/bookings/create` after all lines are stored.

`/bookings/create` remains the cart review and booking-creation page. Users can return to `/shows` through Add More Tickets, select another schedule, and add more lines before checkout.

## Component Boundaries

- `HomePage` owns show searching, pagination, selected show/schedule loading, and placement of the inline workspace on `/shows`.
- A focused inline selection component renders Upcoming Times, vertical ticket-type rows, and the Selected Tickets summary.
- Pure selection-state helpers choose the default bookable schedule, add or remove ticket types, constrain quantities, and calculate summary totals.
- `CartContext` remains responsible for persistent cart state and merging selected lines.
- Navigation components use direct `/shows` links instead of owning ticket-search or ticket-selection state.

The selection component receives show and schedule data through props and emits cart-ready lines. It does not call the booking API; booking creation remains in `/bookings/create`.

## Loading and Error States

- While shows or schedules load, display a stable skeleton or loading message in the workspace and disable selection actions.
- If a requested show or schedule is invalid, fall back to the nearest bookable schedule and show no blocking error.
- If schedule loading fails, show an inline retry action without opening a modal.
- If all schedules are unavailable, show a clear no-upcoming-tickets state.
- If a ticket type becomes sold out before Add to Cart, disable its increment action and require the user to remove it or select a valid quantity.
- Empty summary, invalid quantities, and unavailable ticket types cannot be persisted to the cart.

## Accessibility and Responsive Behavior

- Select and quantity controls are native buttons with descriptive accessible labels.
- Disabled and selected states are communicated through text and attributes, not color alone.
- Keyboard focus order follows schedule controls, vertical ticket rows, summary lines, then Add to Cart.
- On screens below the desktop breakpoint, the right summary becomes a normal block below the ticket rows and is not sticky.
- Ticket rows collapse from a two-column row into stacked content and action controls without horizontal scrolling.

## Testing Strategy

Pure frontend tests cover:

- choosing the earliest future schedule with at least one available ticket type;
- honoring valid requested show and schedule identifiers;
- ignoring expired, sold-out, or invalid schedules;
- adding a selected type with quantity `1`;
- incrementing up to availability and the maximum of 10;
- decrementing to zero and removing the selected type;
- line totals, total quantity, and temporary total;
- converting summary lines to the existing cart item format.

Integration-oriented verification covers:

- Book Now and ticket-search actions route to `/shows` without opening a drawer or modal;
- the Show Detail booking action preselects its show on `/shows`;
- ticket types render vertically and quantity controls appear only in Selected Tickets;
- Add to Cart stores all selected types and redirects to `/bookings/create`;
- frontend tests pass and the Vite production build succeeds.

## Non-Goals

- Do not create a booking or payment directly from `/shows`.
- Do not change backend booking, pricing, or inventory contracts.
- Do not add a new cart persistence format.
- Do not redesign show management, booking history, payment, or ticketing pages.
- Do not add promotions, seat maps, or guest checkout.
