# Inline Show Ticket Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace modal/drawer ticket selection with the approved inline `/shows` workspace, including nearest-available schedule selection, vertical ticket types, right-side quantity controls, cart summary, and redirect to `/bookings/create`.

**Architecture:** Keep the existing cart storage format and backend APIs. Extend the pure ticket-selector state module for schedule selection and summary calculations, add an atomic bulk-cart operation, render a new `ShowTicketWorkspace` component, and let `HomePage` load the selected show's schedules and authoritative schedule snapshot. All booking entry points share one navigation helper that targets `/shows` with optional show/schedule state.

**Tech Stack:** React 18, React Router 6, Tailwind CSS, Node built-in test runner, Vite 8.

## Global Constraints

- `/shows` and compatibility route `/public/shows` are the only public ticket-selection surfaces.
- Do not create a booking or payment directly from `/shows`; Add to Cart redirects to `/bookings/create`.
- Keep `aquapulse.cart.v1` and the existing `scheduleId + ticketType` cart key.
- Ticket types render vertically on the left; quantity controls exist only in Selected Tickets on the right.
- Use cyan–teal for Calendar, Select, quantity, and Add to Cart controls; do not use orange in the new workspace.
- Remove the Selected Time badge and place View Calendar in that position.
- Default to the earliest future schedule with at least one available ticket type.
- Cap each selected line at the smaller of authoritative availability and 10.
- Decreasing quantity to zero removes the line from the summary.
- Follow `AGENTS.md` and `frontend/AGENTS.md`; do not add dependencies.

## File Structure

**Create**

- `frontend/src/features/cart/ShowTicketWorkspace.jsx` — approved v4 inline ticket-selection UI.
- `frontend/src/features/cart/showTicketNavigation.js` — shared `/shows` navigation target builder.
- `frontend/src/features/cart/showTicketNavigation.test.js` — route-state tests.

**Modify**

- `frontend/src/features/cart/ticketSelectorState.js` — bookable schedule selection, ticket selection, and summary calculations.
- `frontend/src/features/cart/ticketSelectorState.test.js` — pure state coverage.
- `frontend/src/features/cart/cartStorage.js` — atomic multi-line cart addition.
- `frontend/src/features/cart/cartStorage.test.js` — bulk-add and merge coverage.
- `frontend/src/features/cart/CartContext.jsx` — expose `addItems`.
- `frontend/src/features/home/HomePage.jsx` — load and render the inline workspace; remove modal state.
- `frontend/src/shared/components/navigation/Navbar.jsx` — route Book Now directly to `/shows`.
- `frontend/src/stitch-react/ShowDetailPage.jsx` — route schedule booking to `/shows`; remove embedded selector.

**Delete**

- `frontend/src/features/cart/TicketSelector.jsx` — obsolete modal/detail selector.
- `frontend/src/shared/components/navigation/TicketSearchDrawer.jsx` — obsolete drawer.

---

### Task 1: Pure Selection State and Schedule Defaults

**Files:**

- Modify: `frontend/src/features/cart/ticketSelectorState.js`
- Modify: `frontend/src/features/cart/ticketSelectorState.test.js`

**Interfaces:**

- Produces: `isScheduleBookable(schedule, now)`, `chooseBookableSchedule(schedules, preferredId, now)`, `selectTicketType(state, type, schedule)`, and `selectedTicketSummary(schedule, state)`.
- Preserves: `createSelectorState`, `selectSchedule`, `setTypeQuantity`, `ticketTypeAvailability`, and `buildCartItem`.

- [ ] **Step 1: Add failing tests for the nearest bookable schedule**

Append tests using a fixed clock so time-zone and wall-clock changes cannot affect the result:

```js
const NOW = new Date('2026-07-14T08:00:00Z').getTime();

test('chooses the earliest future schedule with any ticket type available', () => {
  const schedules = [
    { id: 'sold-out', startTime: '2026-07-14T10:00:00Z', standardAvailableTickets: 0, vipAvailableTickets: 0, familyAvailableTickets: 0 },
    { id: 'later', startTime: '2026-07-15T12:00:00Z', standardAvailableTickets: 2 },
    { id: 'nearest', startTime: '2026-07-14T12:00:00Z', vipAvailableTickets: 1 },
  ];

  assert.equal(chooseBookableSchedule(schedules, '', NOW)?.id, 'nearest');
});

test('honors a valid preferred schedule before the nearest default', () => {
  const schedules = [
    { id: 'nearest', startTime: '2026-07-14T12:00:00Z', standardAvailableTickets: 3 },
    { id: 'preferred', startTime: '2026-07-15T12:00:00Z', familyAvailableTickets: 2 },
  ];

  assert.equal(chooseBookableSchedule(schedules, 'preferred', NOW)?.id, 'preferred');
});

test('rejects schedules inside the thirty minute booking cutoff', () => {
  const schedules = [
    { id: 'closed', startTime: '2026-07-14T08:20:00Z', standardAvailableTickets: 3 },
  ];

  assert.equal(chooseBookableSchedule(schedules, '', NOW), null);
});
```

Import `chooseBookableSchedule` in the test file.

- [ ] **Step 2: Run the state test and confirm the new schedule tests fail**

Run:

```powershell
node --test frontend/src/features/cart/ticketSelectorState.test.js
```

Expected: FAIL because `chooseBookableSchedule` is not exported.

- [ ] **Step 3: Implement bookability and deterministic schedule choice**

Add these functions to `ticketSelectorState.js`:

```js
function scheduleId(schedule) {
  return String(schedule?.id || schedule?.scheduleId || '');
}

export function isScheduleBookable(schedule, now = Date.now()) {
  const start = new Date(schedule?.startTime).getTime();
  if (!Number.isFinite(start) || start <= Number(now) + 30 * 60 * 1000) return false;
  return SELECTOR_TICKET_TYPES.some((type) => ticketTypeAvailability(schedule, type).available > 0);
}

export function chooseBookableSchedule(schedules, preferredId = '', now = Date.now()) {
  const bookable = (Array.isArray(schedules) ? schedules : [])
    .filter((item) => isScheduleBookable(item, now))
    .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
  const preferred = bookable.find((item) => scheduleId(item) === String(preferredId || ''));
  return preferred || bookable[0] || null;
}
```

- [ ] **Step 4: Add failing tests for Select, right-side quantities, and totals**

```js
test('selecting a ticket type adds it with quantity one', () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  assert.equal(selected.quantities.STANDARD, 1);
});

test('selecting a sold-out ticket type leaves state unchanged', () => {
  const initial = createSelectorState('schedule-2');
  assert.deepEqual(selectTicketType(initial, 'VIP', schedule), initial);
});

test('decreasing a selected quantity to zero removes it from the summary', () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'FAMILY', schedule);
  const removed = setTypeQuantity(selected, 'FAMILY', 0, schedule.familyAvailableTickets);
  assert.equal(selectedTicketSummary(schedule, removed).lines.length, 0);
});

test('summary calculates line totals, ticket count, and temporary total', () => {
  let state = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  state = setTypeQuantity(state, 'STANDARD', 2, schedule.standardAvailableTickets);
  state = selectTicketType(state, 'FAMILY', schedule);

  const summary = selectedTicketSummary(schedule, state);
  assert.deepEqual(summary.lines.map(({ ticketType, quantity, lineTotal }) => ({ ticketType, quantity, lineTotal })), [
    { ticketType: 'STANDARD', quantity: 2, lineTotal: 5000 },
    { ticketType: 'FAMILY', quantity: 1, lineTotal: 3750 },
  ]);
  assert.equal(summary.totalQuantity, 3);
  assert.equal(summary.totalAmount, 8750);
});
```

Import `selectTicketType` and `selectedTicketSummary`.

- [ ] **Step 5: Run tests and confirm the new selection tests fail**

Run the same `node --test` command.

Expected: FAIL because the new selection and summary exports do not exist.

- [ ] **Step 6: Implement Select and summary calculations**

```js
export function selectTicketType(state, ticketType, schedule) {
  const availability = ticketTypeAvailability(schedule, ticketType);
  if (availability.disabled) return state;
  return setTypeQuantity(state, ticketType, 1, availability.available);
}

export function selectedTicketSummary(schedule, state) {
  const lines = SELECTOR_TICKET_TYPES
    .filter((type) => Number(state?.quantities?.[type]) > 0)
    .map((type) => {
      const item = buildCartItem(schedule, type, state.quantities[type]);
      return { ...item, lineTotal: item.unitPrice * item.quantity };
    });
  return {
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    totalAmount: lines.reduce((sum, line) => sum + line.lineTotal, 0),
  };
}
```

- [ ] **Step 7: Run the complete selector-state tests**

Run:

```powershell
node --test frontend/src/features/cart/ticketSelectorState.test.js
```

Expected: all tests pass.

- [ ] **Step 8: Commit the pure selection state**

```powershell
git add frontend/src/features/cart/ticketSelectorState.js frontend/src/features/cart/ticketSelectorState.test.js
git commit -m "feat: model inline ticket selection"
```

---

### Task 2: Atomic Multi-Line Cart Addition

**Files:**

- Modify: `frontend/src/features/cart/cartStorage.js`
- Modify: `frontend/src/features/cart/cartStorage.test.js`
- Modify: `frontend/src/features/cart/CartContext.jsx`

**Interfaces:**

- Produces: `addCartItems(items, additions)` and `CartContext.addItems(additions)`.
- Consumes: each addition's existing `availableTickets` field as its maximum quantity.

- [ ] **Step 1: Write failing bulk-add tests**

Add to `cartStorage.test.js`:

```js
test('adds multiple selected ticket types in one cart update', () => {
  const result = addCartItems([], [
    { scheduleId: 's1', ticketType: 'STANDARD', quantity: 2, availableTickets: 8 },
    { scheduleId: 's1', ticketType: 'VIP', quantity: 1, availableTickets: 3 },
  ]);
  assert.deepEqual(result.map(({ ticketType, quantity }) => ({ ticketType, quantity })), [
    { ticketType: 'STANDARD', quantity: 2 },
    { ticketType: 'VIP', quantity: 1 },
  ]);
});

test('bulk add merges existing lines and respects authoritative availability', () => {
  const existing = [{ scheduleId: 's1', ticketType: 'STANDARD', quantity: 3 }];
  const result = addCartItems(existing, [
    { scheduleId: 's1', ticketType: 'STANDARD', quantity: 4, availableTickets: 5 },
  ]);
  assert.equal(result[0].quantity, 5);
});
```

Import `addCartItems`.

- [ ] **Step 2: Run cart storage tests and verify failure**

```powershell
node --test frontend/src/features/cart/cartStorage.test.js
```

Expected: FAIL because `addCartItems` is not exported.

- [ ] **Step 3: Implement the pure bulk operation**

```js
export function addCartItems(items, additions) {
  return (Array.isArray(additions) ? additions : []).reduce(
    (currentItems, item) => addCartItem(currentItems, item, item?.availableTickets),
    items,
  );
}
```

- [ ] **Step 4: Expose one context update for all selected lines**

Import `addCartItems` into `CartContext.jsx`, add:

```js
const addItems = useCallback((additions) => {
  setItems((currentItems) => addCartItems(currentItems, additions));
}, []);
```

Include `addItems` in the memoized context value and dependency list.

- [ ] **Step 5: Run cart tests and the aggregate frontend tests**

```powershell
node --test frontend/src/features/cart/cartStorage.test.js
npm --prefix frontend test
```

Expected: all tests pass.

- [ ] **Step 6: Commit atomic cart addition**

```powershell
git add frontend/src/features/cart/cartStorage.js frontend/src/features/cart/cartStorage.test.js frontend/src/features/cart/CartContext.jsx
git commit -m "feat: add selected ticket lines atomically"
```

---

### Task 3: Shared Navigation Target

**Files:**

- Create: `frontend/src/features/cart/showTicketNavigation.js`
- Create: `frontend/src/features/cart/showTicketNavigation.test.js`

**Interfaces:**

- Produces: `showTicketTarget({ showId, scheduleId } = {})` returning `{ to, state }`.
- State fields: `scrollTo: 'ticket-workspace'`, `ticketSelectionShowId`, and `ticketSelectionScheduleId`.

- [ ] **Step 1: Write the failing navigation tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { showTicketTarget } from './showTicketNavigation.js';

test('generic booking actions target the shows ticket workspace', () => {
  assert.deepEqual(showTicketTarget(), {
    to: '/shows',
    state: { scrollTo: 'ticket-workspace' },
  });
});

test('show-specific actions preserve show and schedule identifiers', () => {
  assert.deepEqual(showTicketTarget({ showId: 'show-1', scheduleId: 'schedule-2' }), {
    to: '/shows',
    state: {
      scrollTo: 'ticket-workspace',
      ticketSelectionShowId: 'show-1',
      ticketSelectionScheduleId: 'schedule-2',
    },
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```powershell
node --test frontend/src/features/cart/showTicketNavigation.test.js
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the navigation helper**

```js
export function showTicketTarget({ showId, scheduleId } = {}) {
  const state = { scrollTo: 'ticket-workspace' };
  if (showId) state.ticketSelectionShowId = String(showId);
  if (scheduleId) state.ticketSelectionScheduleId = String(scheduleId);
  return { to: '/shows', state };
}
```

- [ ] **Step 4: Run the navigation tests**

```powershell
node --test frontend/src/features/cart/showTicketNavigation.test.js
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit the navigation contract**

```powershell
git add frontend/src/features/cart/showTicketNavigation.js frontend/src/features/cart/showTicketNavigation.test.js
git commit -m "feat: centralize show ticket navigation"
```

---

### Task 4: Approved v4 Inline Ticket Workspace

**Files:**

- Create: `frontend/src/features/cart/ShowTicketWorkspace.jsx`
- Modify: `frontend/src/features/home/HomePage.jsx`

**Interfaces:**

- `ShowTicketWorkspace` props: `show`, `schedules`, `schedule`, `selectedScheduleId`, `loading`, `error`, `onScheduleChange`, and `onRetry`.
- Consumes: `selectTicketType`, `selectSchedule`, `setTypeQuantity`, `selectedTicketSummary`, `ticketTypeAvailability`, `SELECTOR_TICKET_TYPES`, `CartContext.addItems`, and `showTicketTarget` state fields.
- HomePage owns schedule-list and authoritative schedule loading.

- [ ] **Step 1: Add a failing pure test for switching schedules**

Extend `ticketSelectorState.test.js` to assert that the existing `selectSchedule` contract clears every selected type when the schedule changes and preserves state when the identifier is unchanged. The first assertion already exists; add:

```js
test('selecting the current schedule preserves the current summary', () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  assert.equal(selectSchedule(selected, 'schedule-2'), selected);
});
```

- [ ] **Step 2: Run the focused state test**

```powershell
node --test frontend/src/features/cart/ticketSelectorState.test.js
```

Expected: PASS, documenting the state reset contract required by the component.

- [ ] **Step 3: Create `ShowTicketWorkspace.jsx` with the approved layout**

Implement these behaviors in one focused component:

```jsx
export default function ShowTicketWorkspace({
  show,
  schedules,
  schedule,
  selectedScheduleId,
  loading,
  error,
  onScheduleChange,
  onRetry,
}) {
  const { addItems } = useCart();
  const navigate = useNavigate();
  const [state, setState] = useState(() => createSelectorState(selectedScheduleId));
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setState((current) => selectSchedule(current, selectedScheduleId));
  }, [selectedScheduleId]);

  const summary = useMemo(() => selectedTicketSummary(schedule, state), [schedule, state]);

  const handleAddToCart = () => {
    if (summary.lines.length === 0) return;
    addItems(summary.lines);
    navigate('/bookings/create');
  };
```

Render:

- root section with `id="ticket-workspace"` and `scroll-mt-24`;
- Upcoming Times heading using the selected schedule date;
- schedule header with time range, venue, summed per-type availability, and cyan–teal View Calendar button;
- an inline calendar/schedule list, never a dialog, with only bookable schedules enabled;
- three vertical ticket rows with price, availability, and Select/Selected action;
- a sticky right summary with quantities and line totals;
- decrement/increment buttons only in the right summary;
- cyan–teal Add to Cart & Continue button disabled when empty;
- loading, retry, and no-upcoming-schedules states;
- mobile layout that stacks the summary below the ticket rows.

Use existing `formatCurrency` and `getTicketTypeLabel`. Give every quantity button an `aria-label` containing the ticket-type label. Selected buttons must include text such as `Standard Entry selected`, not rely only on color.

- [ ] **Step 4: Replace HomePage modal state with workspace loading state**

In `HomePage.jsx`:

1. import `useNavigate`, `getSchedule`, `ShowTicketWorkspace`, `chooseBookableSchedule`, and `showTicketTarget`;
2. remove the `TicketSelector` import and `selectorShow` modal state;
3. add `workspaceShow`, `workspaceSchedules`, `workspaceSchedule`, `workspaceLoading`, `workspaceError`, and a request-id ref;
4. replace `openSelector` with `activateTicketWorkspace(show, preferredScheduleId)`.

The activation function must:

```js
const activateTicketWorkspace = async (show, preferredScheduleId = '') => {
  if (!show?.id) return;
  const requestId = ++workspaceRequest.current;
  setWorkspaceShow(show);
  setWorkspaceLoading(true);
  setWorkspaceError('');
  try {
    const list = await getShowSchedules(show.id);
    const schedules = Array.isArray(list) ? list : [];
    const selected = chooseBookableSchedule(schedules, preferredScheduleId);
    const detail = selected ? await getSchedule(selected.id || selected.scheduleId) : null;
    if (workspaceRequest.current !== requestId) return;
    setWorkspaceSchedules(schedules);
    setWorkspaceSchedule(detail);
    requestAnimationFrame(() => document.getElementById('ticket-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  } catch (loadError) {
    if (workspaceRequest.current === requestId) setWorkspaceError(getShowsErrorMessage(loadError));
  } finally {
    if (workspaceRequest.current === requestId) setWorkspaceLoading(false);
  }
};
```

Add `handleWorkspaceScheduleChange(scheduleId)` that calls `getSchedule(scheduleId)`, updates the authoritative snapshot, and clears stale errors. Pass it to `ShowTicketWorkspace`.

- [ ] **Step 5: Route all HomePage booking actions through `/shows`**

Create one helper inside HomePage:

```js
const goToTicketWorkspace = (show, scheduleId = '') => {
  const target = showTicketTarget({ showId: show?.id, scheduleId });
  navigate(target.to, { state: target.state });
};
```

Use it for hero Book Tickets, show-card booking, and upcoming-schedule Book Now. Rename the show-card `Select Tickets` action to `Book Now`. The show-selection form action should route to the selected show rather than open a modal.

Update the location-state effect to read `ticketSelectionShowId` and `ticketSelectionScheduleId`, activate the requested workspace once per navigation key, and fall back to `firstBookableShow.nextScheduleId` for generic `/shows` navigation. Preserve search/pagination behavior.

- [ ] **Step 6: Render the workspace and remove modal markup**

Place `ShowTicketWorkspace` immediately after the show grid/pagination section so navigation scrolls to a stable location. Delete the fixed overlay at the bottom of `HomePage`. Keep `TicketSelector.jsx` temporarily because Show Detail still imports it until Task 5.

- [ ] **Step 7: Run state tests and the production build**

```powershell
node --test frontend/src/features/cart/ticketSelectorState.test.js
npm --prefix frontend run build
```

Expected: tests pass and Vite exits 0.

- [ ] **Step 8: Commit the inline workspace**

```powershell
git add frontend/src/features/cart/ShowTicketWorkspace.jsx frontend/src/features/home/HomePage.jsx frontend/src/features/cart/ticketSelectorState.test.js
git commit -m "feat: select show tickets inline"
```

---

### Task 5: Remove Drawer and Redirect Every Booking Entry Point

**Files:**

- Modify: `frontend/src/shared/components/navigation/Navbar.jsx`
- Modify: `frontend/src/stitch-react/ShowDetailPage.jsx`
- Delete: `frontend/src/features/cart/TicketSelector.jsx`
- Delete: `frontend/src/shared/components/navigation/TicketSearchDrawer.jsx`

**Interfaces:**

- Consumes: `showTicketTarget` from Task 3.
- Produces: no modal/drawer entry point; all Book Now actions use `/shows` navigation state.

- [ ] **Step 1: Convert Navbar Book Now to direct navigation**

Remove the `TicketSearchDrawer` import, `isTicketDrawerOpen`, the custom `aquapulse:open-ticket-drawer` listener, open/close drawer functions, and drawer JSX. Add:

```js
const handleBookNow = () => {
  closeMobileMenu();
  const target = showTicketTarget();
  navigate(target.to, { state: target.state });
};
```

Use `handleBookNow` for desktop and mobile Book Now buttons.

- [ ] **Step 2: Convert Show Detail schedule actions to `/shows`**

In `ShowDetailPage.jsx`:

- remove the `TicketSelector` import;
- add `useNavigate` and `showTicketTarget`;
- remove `selectedScheduleId`, `selectorSchedules`, the embedded right-side selector, and orange selected-card styling;
- remove `setSelectedScheduleId` calls from the date input and Back to today handlers;
- retain schedule/date browsing for show information;
- replace each available schedule's Select handler with:

```js
const target = showTicketTarget({ showId: show.id, scheduleId: schedule.id });
navigate(target.to, { state: target.state });
```

The button text becomes `Book Now`. Closed and sold-out schedules remain disabled.

- [ ] **Step 3: Delete the obsolete search drawer**

Delete `frontend/src/shared/components/navigation/TicketSearchDrawer.jsx` and `frontend/src/features/cart/TicketSelector.jsx`. Confirm no drawer or legacy selector references remain:

```powershell
rg -n "TicketSelector|TicketSearchDrawer|open-ticket-drawer|ticketSelectorShowId|ticketSelectorScheduleId" frontend/src
```

Expected: no output.

- [ ] **Step 4: Verify all live Book Now and booking actions**

```powershell
rg -n "Book Now|Book Tickets|Select Tickets" frontend/src/features frontend/src/shared frontend/src/stitch-react
```

Inspect every live result. User-facing booking actions must either use `showTicketTarget`, link to `/shows`, or be the approved per-ticket Select actions inside `ShowTicketWorkspace`. Static `stitch-html` reference files are outside runtime scope.

- [ ] **Step 5: Run navigation tests and build**

```powershell
node --test frontend/src/features/cart/showTicketNavigation.test.js
npm --prefix frontend run build
```

Expected: navigation tests pass and the production build exits 0.

- [ ] **Step 6: Commit route consolidation**

```powershell
git add frontend/src/features/cart/TicketSelector.jsx frontend/src/shared/components/navigation/Navbar.jsx frontend/src/shared/components/navigation/TicketSearchDrawer.jsx frontend/src/stitch-react/ShowDetailPage.jsx
git commit -m "refactor: route ticket actions through shows"
```

---

### Task 6: Full Verification and Cleanup

**Files:**

- Verify all modified frontend files.

- [ ] **Step 1: Run the complete frontend test suite**

```powershell
npm --prefix frontend test
```

Expected: all Node tests pass with zero failures.

- [ ] **Step 2: Run the production build**

```powershell
npm --prefix frontend run build
```

Expected: Vite exits 0. The existing large-chunk warning may remain but no build error is allowed.

- [ ] **Step 3: Check runtime references and whitespace**

```powershell
rg -n "TicketSelector|TicketSearchDrawer|open-ticket-drawer|ticketSelectorShowId|ticketSelectorScheduleId" frontend/src
git diff --check
git status --short
```

Expected: the reference search is empty, `git diff --check` reports no errors, and only intentional files are changed.

- [ ] **Step 4: Perform browser acceptance checks**

Run the frontend and verify:

1. Navbar Book Now redirects to `/shows` and scrolls to the inline workspace.
2. Generic `/shows` selects the nearest future schedule with availability.
3. Show-card and Show Detail actions preselect the requested show and schedule.
4. View Calendar expands schedule choices inline and contains no modal.
5. Ticket types are vertical on the left with no quantity controls.
6. Selecting Standard, VIP, or Family adds quantity `1` to the right summary.
7. Right-side `− / +` updates line totals, ticket count, and temporary total.
8. Decreasing to zero removes the summary line and restores the left Select action.
9. Add to Cart & Continue merges all selected lines and redirects to `/bookings/create`.
10. Mobile stacks Selected Tickets below the ticket rows without horizontal scrolling.

- [ ] **Step 5: Inspect the final commit range**

```powershell
git log --oneline --max-count=6
git status --short --branch
```

Expected: the task commits are present and the worktree is clean.
