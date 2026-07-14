# Show Detail Ticket Workspace Design

## Goal

Move ticket selection out of the standalone `/shows` Home variant and into each show's View Details page. The Home page remains the show catalog. A user chooses a show before entering the ticket workspace, so the workspace never asks them to choose a show again.

## Route Contract

- `/` renders the Home catalog.
- `/shows` redirects to `/`.
- `/public/shows` redirects to `/` for compatibility.
- `/shows/:showId` renders Show Detail and owns ticket selection for that show.
- `/public/shows/:showId` remains a compatibility route to the same Show Detail page.
- A selected booking date is shareable and refresh-safe through `?date=YYYY-MM-DD`.
- `#ticket-workspace` identifies the ticket-selection section and is used when an action should scroll directly to booking.
- An invalid date query is ignored; Show Detail selects the nearest bookable schedule instead.

## Navigation Flows

### Navbar Book Now

The Navbar Book Now action opens a right-side drawer. The drawer contains only show and date selection; it does not contain ticket types, quantities, or cart actions.

1. Load the active show catalog.
2. The user selects one show.
3. Load that show's schedules.
4. Offer only dates containing at least one schedule that starts more than 30 minutes in the future and has ticket availability.
5. The user selects a date.
6. Continue navigates to `/shows/:showId?date=YYYY-MM-DD#ticket-workspace`.

Continue remains disabled until both show and date are selected. Loading failures render an inline retry state inside the drawer.

### Show-specific Actions

- Home search results and show cards send View Details to `/shows/:showId`.
- A show-specific Book Now action sends the user to `/shows/:showId#ticket-workspace` and lets Show Detail select the nearest bookable schedule.
- A Book Now action that already knows a date uses `/shows/:showId?date=YYYY-MM-DD#ticket-workspace`.
- Cart item View Detail links remain `/shows/:showId`.

### Generic Catalog Actions

Footer Book Tickets, Profile booking links, booking history empty-state actions, and Create Booking Browse/Add More actions that do not identify a show navigate to `/#shows`. They do not choose a show automatically.

## Home Page

Home keeps the hero, show search/filtering, show cards, pagination, upcoming schedule marketing content, promotions, and other landing-page sections.

Home removes:

- `ShowTicketWorkspace` rendering;
- workspace show/schedule/loading/error state;
- route-state resolution for ticket selection;
- generic nearest-bookable-show resolution used only by the old `/shows` page.

Home show cards keep View Details. Their Book Now actions navigate to the corresponding Show Detail ticket workspace instead of activating an embedded Home workspace.

## Show Detail Page

Show Detail keeps its hero gallery and About the Show content. The current Upcoming Times cards and their orange Book Now buttons are replaced by the shared ticket workspace.

Show Detail owns:

- the fixed show loaded from `showId`;
- the show's schedule list;
- the selected authoritative schedule detail;
- schedule loading, error, retry, and stale-request protection;
- date intent read from the URL query;
- scrolling to `#ticket-workspace` when the hash requests it.

The workspace heading identifies the selected show's date and schedule. It never displays “Choose your show.”

### Default Schedule

If `date` is valid, select the earliest bookable schedule on that local calendar date. If the date is invalid or omitted, select the earliest bookable schedule across the show. Bookability uses the existing 30-minute cutoff and authoritative ticket availability.

If a valid requested date has no remaining bookable schedule, do not switch shows. Render an actionable notice and offer the show's other bookable dates/times through View Calendar.

### Ticket Workspace Layout

- Header: selected date, time, venue, total availability, and View Calendar.
- Left column: Standard, VIP, and Family ticket types stacked vertically with Select buttons.
- Right column: Selected Tickets summary with all quantity `+/-` controls, ticket count, temporary total, and Add to Cart & Continue.
- Desktop summary remains sticky; mobile stacks the summary below ticket types.
- Controls use the existing cyan–teal visual language.

View Calendar lists only bookable schedules for the current show. Choosing a schedule updates the date query so refresh and browser history preserve the selection context.

### Cart Confirmation

Add to Cart & Continue keeps the existing safety behavior:

- re-fetch authoritative schedule availability before persistence;
- invalidate stale async confirmation after schedule/state changes or unmount;
- reconcile reduced or sold-out quantities into the visible summary;
- require another click when availability materially changes;
- add all unchanged selected lines atomically through `CartContext.addItems`;
- navigate to `/bookings/create` only after a successful unchanged confirmation.

## Right-side Drawer

Reintroduce a focused Navbar drawer as a navigation component, not a ticket selector. It has one responsibility: collect show and date intent and build the Show Detail URL.

The drawer resets its dependent date when the show changes. It ignores stale schedule responses when the user changes shows quickly or closes the drawer. Closing and reopening the drawer returns to a predictable initial state.

Accessibility requirements:

- dialog semantics with an accessible title;
- focusable close button;
- Escape closes the drawer;
- form controls have explicit labels;
- loading and error updates use live/status semantics;
- Continue communicates its disabled state natively.

## Error Handling

- Show not found: keep the current Show Detail error state and link back to Home.
- Show or schedule API failure: render inline retry without clearing a valid previously displayed snapshot incorrectly.
- Requested date unavailable: show a notice and available alternatives; do not add cart items.
- No bookable schedules for the show: render a show-specific empty state.
- Drawer API failure: retain the user's current show intent where safe and expose Try Again.
- Invalid query date: fall back to the nearest bookable schedule without throwing.

## Testing Strategy

Add focused tests for:

- `/shows` and `/public/shows` redirecting to `/`;
- navigation target construction for detail, date query, and workspace hash;
- drawer show/date reset, bookable-date filtering, and resulting URL;
- earliest bookable schedule within a requested date;
- invalid/unavailable date fallback and notice behavior;
- Home no longer owning or rendering a ticket workspace;
- Show Detail schedule loading, retry, stale-request protection, and workspace ownership;
- existing cart confirmation and quantity behavior after relocation;
- generic catalog links using `/#shows`;
- legacy compatibility detail route.

Run the complete frontend test suite and production build after the focused tests pass.

## Non-goals

- No backend API or database changes.
- No new ticket types, pricing rules, cart format, or booking/payment behavior.
- No standalone show-selection page.
- No ticket quantity controls inside the Navbar drawer.
- No automatic selection of a different show when the chosen show or date is unavailable.
- No new frontend dependencies.

