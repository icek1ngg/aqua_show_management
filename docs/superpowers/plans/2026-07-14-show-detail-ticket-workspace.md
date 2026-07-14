# Show Detail Ticket Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the standalone `/shows` selection page, place the complete ticket workspace in each Show Detail page, and restore a right-side Navbar drawer that chooses a show and bookable date before navigating to that detail page.

**Architecture:** Route and date intent are represented by shareable URLs, while pure helpers own URL generation, drawer selection state, and schedule-by-date choice. `ShowDetailPage` owns show/schedule loading and passes one authoritative schedule into the existing `ShowTicketWorkspace`; Home returns to being a catalog only.

**Tech Stack:** React 18, React Router 6, JavaScript ES modules, Tailwind CSS, Node `node:test`, Vite.

## Global Constraints

- `/shows` and `/public/shows` redirect to `/`.
- `/shows/:showId` owns ticket selection for that fixed show.
- `/public/shows/:showId` remains compatible.
- Navbar Book Now uses a right-side drawer that selects show and date only.
- The selected date is stored as `?date=YYYY-MM-DD`; ticket focus uses `#ticket-workspace`.
- A valid requested date selects its earliest bookable schedule; an unavailable requested date does not switch shows.
- Bookability keeps the existing 30-minute cutoff and authoritative availability rules.
- Ticket types stay vertical on the left; all quantity controls stay in Selected Tickets on the right.
- Cart confirmation keeps fresh inventory reconciliation, stale-operation guards, atomic persistence, and `/bookings/create` navigation.
- Generic catalog actions navigate to `/#shows`.
- Do not change backend APIs, the cart storage format, pricing rules, booking/payment behavior, or dependencies.
- Follow `AGENTS.md` and `frontend/AGENTS.md`.

---

### Task 1: Detail Navigation Contract and Legacy Route Redirects

**Files:**

- Modify: `frontend/src/features/cart/showTicketNavigation.js`
- Modify: `frontend/src/features/cart/showTicketNavigation.test.js`
- Modify: `frontend/src/app/router.jsx`

**Interfaces:**

- Produces: `SHOWS_ROUTE_REDIRECT`, `SHOW_CATALOG_TARGET`, `isDateKey(value)`, and `showTicketTarget({ showId, date }) -> string`.
- Consumes: React Router `Navigate` for `/shows` compatibility redirects.

- [ ] **Step 1: Replace the old navigation tests with failing detail-route tests**

Use this complete test file:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SHOW_CATALOG_TARGET,
  SHOWS_ROUTE_REDIRECT,
  isDateKey,
  showTicketTarget,
} from './showTicketNavigation.js';

test('generic booking actions return to the Home show catalog', () => {
  assert.equal(SHOWS_ROUTE_REDIRECT, '/');
  assert.equal(SHOW_CATALOG_TARGET, '/#shows');
  assert.equal(showTicketTarget(), '/#shows');
});

test('show-specific booking actions target the detail ticket workspace', () => {
  assert.equal(
    showTicketTarget({ showId: 'show 1' }),
    '/shows/show%201#ticket-workspace',
  );
});

test('a valid selected date is persisted in the detail URL', () => {
  assert.equal(
    showTicketTarget({ showId: 'show-1', date: '2026-07-17' }),
    '/shows/show-1?date=2026-07-17#ticket-workspace',
  );
});

test('invalid dates are omitted from the target', () => {
  assert.equal(isDateKey('2026-07-17'), true);
  assert.equal(isDateKey('2026-02-30'), false);
  assert.equal(isDateKey('17-07-2026'), false);
  assert.equal(
    showTicketTarget({ showId: 'show-1', date: '17-07-2026' }),
    '/shows/show-1#ticket-workspace',
  );
});
```

- [ ] **Step 2: Run the navigation test and confirm RED**

Run:

```powershell
node --test frontend/src/features/cart/showTicketNavigation.test.js
```

Expected: FAIL because the existing helper returns `{ to, state }` and does not export the new constant/date validator.

- [ ] **Step 3: Implement the URL contract**

Replace `showTicketNavigation.js` with:

```js
export const SHOWS_ROUTE_REDIRECT = '/';
export const SHOW_CATALOG_TARGET = '/#shows';

export function isDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function showTicketTarget({ showId, date } = {}) {
  if (!showId) return SHOW_CATALOG_TARGET;
  const path = `/shows/${encodeURIComponent(String(showId))}`;
  const query = isDateKey(date) ? `?date=${date}` : '';
  return `${path}${query}#ticket-workspace`;
}
```

- [ ] **Step 4: Run the navigation test and confirm GREEN**

Run the Step 2 command.

Expected: 4 tests pass.

- [ ] **Step 5: Redirect both standalone routes in the router**

Change the React Router import, import the tested redirect constant, and change the two route elements:

```jsx
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { SHOWS_ROUTE_REDIRECT } from '../features/cart/showTicketNavigation.js';
```

```jsx
{
  path: 'public/shows',
  element: <Navigate replace to={SHOWS_ROUTE_REDIRECT} />,
},
{
  path: 'shows',
  element: <Navigate replace to={SHOWS_ROUTE_REDIRECT} />,
},
```

Keep both `shows/:showId` detail routes unchanged.

- [ ] **Step 6: Build to validate the JSX route change**

Run:

```powershell
npm --prefix frontend run build
```

Expected: Vite build exits 0.

- [ ] **Step 7: Commit the route contract**

```powershell
git add frontend/src/features/cart/showTicketNavigation.js frontend/src/features/cart/showTicketNavigation.test.js frontend/src/app/router.jsx
git commit -m "refactor: route ticket selection through show details"
```

---

### Task 2: Bookable Dates and Show Detail Schedule Choice

**Files:**

- Create: `frontend/src/features/cart/showDetailSchedule.js`
- Create: `frontend/src/features/cart/showDetailSchedule.test.js`

**Interfaces:**

- Consumes: `isScheduleBookable(schedule, now)` from `ticketSelectorState.js` and `isDateKey(value)` from `showTicketNavigation.js`.
- Produces: `localDateKey(value)`, `bookableDateOptions(schedules, now)`, and `chooseShowDetailSchedule(schedules, requestedDate, now)`.

- [ ] **Step 1: Write failing tests for dates and schedule selection**

Create this test file:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bookableDateOptions,
  chooseShowDetailSchedule,
} from './showDetailSchedule.js';

const NOW = new Date('2026-07-14T08:00:00Z').getTime();
const schedules = [
  { id: 'sold-out', startTime: '2026-07-15T08:00:00Z', availableTickets: 0 },
  { id: 'day-one-late', startTime: '2026-07-17T13:00:00Z', availableTickets: 4 },
  { id: 'day-one-early', startTime: '2026-07-17T09:00:00Z', availableTickets: 2 },
  { id: 'day-two', startTime: '2026-07-18T10:00:00Z', availableTickets: 3 },
  { id: 'cutoff', startTime: '2026-07-14T08:20:00Z', availableTickets: 9 },
];

test('returns unique sorted dates that contain a bookable schedule', () => {
  assert.deepEqual(bookableDateOptions(schedules, NOW), ['2026-07-17', '2026-07-18']);
});

test('selects the earliest bookable schedule in the requested date', () => {
  const result = chooseShowDetailSchedule(schedules, '2026-07-17', NOW);
  assert.equal(result.schedule.id, 'day-one-early');
  assert.equal(result.requestedDateUnavailable, false);
  assert.equal(result.effectiveDate, '2026-07-17');
});

test('keeps a valid unavailable date as an actionable empty intent', () => {
  const result = chooseShowDetailSchedule(schedules, '2026-07-15', NOW);
  assert.equal(result.schedule, null);
  assert.equal(result.requestedDateUnavailable, true);
  assert.equal(result.effectiveDate, '2026-07-15');
});

test('invalid or missing dates fall back to the nearest bookable schedule', () => {
  assert.equal(chooseShowDetailSchedule(schedules, 'bad-date', NOW).schedule.id, 'day-one-early');
  assert.equal(chooseShowDetailSchedule(schedules, '', NOW).schedule.id, 'day-one-early');
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

```powershell
node --test frontend/src/features/cart/showDetailSchedule.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure date and schedule helpers**

Create `showDetailSchedule.js`:

```js
import { isDateKey } from './showTicketNavigation.js';
import { isScheduleBookable } from './ticketSelectorState.js';

export function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sortedBookableSchedules(schedules, now) {
  return (Array.isArray(schedules) ? schedules : [])
    .filter((schedule) => isScheduleBookable(schedule, now))
    .sort((first, second) => (
      new Date(first.startTime).getTime() - new Date(second.startTime).getTime()
    ));
}

export function bookableDateOptions(schedules, now = Date.now()) {
  return [...new Set(sortedBookableSchedules(schedules, now).map((item) => localDateKey(item.startTime)))]
    .filter(Boolean);
}

export function chooseShowDetailSchedule(schedules, requestedDate = '', now = Date.now()) {
  const bookable = sortedBookableSchedules(schedules, now);
  const validRequestedDate = isDateKey(requestedDate) ? requestedDate : '';
  if (validRequestedDate) {
    const schedule = bookable.find((item) => localDateKey(item.startTime) === validRequestedDate) || null;
    return {
      schedule,
      effectiveDate: validRequestedDate,
      requestedDateUnavailable: !schedule,
    };
  }
  const schedule = bookable[0] || null;
  return {
    schedule,
    effectiveDate: schedule ? localDateKey(schedule.startTime) : '',
    requestedDateUnavailable: false,
  };
}
```

- [ ] **Step 4: Run focused and selector-state tests**

```powershell
node --test frontend/src/features/cart/showDetailSchedule.test.js frontend/src/features/cart/ticketSelectorState.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Commit the schedule selection domain**

```powershell
git add frontend/src/features/cart/showDetailSchedule.js frontend/src/features/cart/showDetailSchedule.test.js
git commit -m "feat: select show schedules by bookable date"
```

---

### Task 3: Right-side Navbar Show and Date Drawer

**Files:**

- Create: `frontend/src/shared/components/navigation/ticketBookingDrawerState.js`
- Create: `frontend/src/shared/components/navigation/ticketBookingDrawerState.test.js`
- Create: `frontend/src/shared/components/navigation/TicketBookingDrawer.jsx`
- Modify: `frontend/src/shared/components/navigation/Navbar.jsx`

**Interfaces:**

- Consumes: `getShows`, `getShowSchedules`, `bookableDateOptions`, and `showTicketTarget`.
- Produces: `createDrawerSelection()`, `changeDrawerShow(state, showId)`, `changeDrawerDate(state, date, dates)`, `drawerDestination(state)`, and `TicketBookingDrawer`.

- [ ] **Step 1: Write failing reducer tests for dependent show/date state**

Create `ticketBookingDrawerState.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  changeDrawerDate,
  changeDrawerShow,
  createDrawerSelection,
  drawerDestination,
} from './ticketBookingDrawerState.js';

test('changing show clears the dependent selected date', () => {
  const selected = { showId: 'show-1', date: '2026-07-17' };
  assert.deepEqual(changeDrawerShow(selected, 'show-2'), { showId: 'show-2', date: '' });
});

test('date selection accepts only a date offered for the selected show', () => {
  const state = { showId: 'show-1', date: '' };
  assert.deepEqual(
    changeDrawerDate(state, '2026-07-17', ['2026-07-17']),
    { showId: 'show-1', date: '2026-07-17' },
  );
  assert.deepEqual(changeDrawerDate(state, '2026-07-18', ['2026-07-17']), state);
});

test('destination requires both show and date', () => {
  assert.equal(drawerDestination(createDrawerSelection()), null);
  assert.equal(drawerDestination({ showId: 'show-1', date: '' }), null);
  assert.equal(
    drawerDestination({ showId: 'show-1', date: '2026-07-17' }),
    '/shows/show-1?date=2026-07-17#ticket-workspace',
  );
});
```

- [ ] **Step 2: Run the state test and confirm RED**

```powershell
node --test frontend/src/shared/components/navigation/ticketBookingDrawerState.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the drawer selection state**

Create `ticketBookingDrawerState.js`:

```js
import { showTicketTarget } from '../../../features/cart/showTicketNavigation.js';

export function createDrawerSelection() {
  return { showId: '', date: '' };
}

export function changeDrawerShow(state, showId) {
  return { ...state, showId: String(showId || ''), date: '' };
}

export function changeDrawerDate(state, date, offeredDates) {
  const nextDate = String(date || '');
  if (!(Array.isArray(offeredDates) ? offeredDates : []).includes(nextDate)) return state;
  return { ...state, date: nextDate };
}

export function drawerDestination(state) {
  if (!state?.showId || !state?.date) return null;
  return showTicketTarget({ showId: state.showId, date: state.date });
}
```

- [ ] **Step 4: Run the drawer state test and confirm GREEN**

Run the Step 2 command.

Expected: 3 tests pass.

- [ ] **Step 5: Create the accessible drawer component**

Implement `TicketBookingDrawer.jsx` with these exact behaviors:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { bookableDateOptions } from '../../../features/cart/showDetailSchedule.js';
import { getShowSchedules, getShows } from '../../../services/showService.js';
import {
  changeDrawerDate,
  changeDrawerShow,
  createDrawerSelection,
  drawerDestination,
} from './ticketBookingDrawerState.js';

export default function TicketBookingDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [selection, setSelection] = useState(createDrawerSelection);
  const [shows, setShows] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const scheduleRequest = useRef(0);
  const dates = useMemo(() => bookableDateOptions(schedules), [schedules]);
  const destination = drawerDestination(selection);

  useEffect(() => {
    if (!open) {
      scheduleRequest.current += 1;
      setSelection(createDrawerSelection());
      setSchedules([]);
      setError('');
      return undefined;
    }
    let active = true;
    setLoadingShows(true);
    setError('');
    getShows({ page: 0, size: 100 })
      .then((response) => {
        if (active) setShows(Array.isArray(response?.items) ? response.items : []);
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || 'Could not load shows. Please try again.');
      })
      .finally(() => {
        if (active) setLoadingShows(false);
      });
    return () => { active = false; };
  }, [open, reloadKey]);

  useEffect(() => {
    const requestId = ++scheduleRequest.current;
    setSchedules([]);
    if (!open || !selection.showId) {
      setLoadingSchedules(false);
      return undefined;
    }
    setLoadingSchedules(true);
    setError('');
    getShowSchedules(selection.showId)
      .then((items) => {
        if (scheduleRequest.current === requestId) {
          setSchedules(Array.isArray(items) ? items : []);
        }
      })
      .catch((loadError) => {
        if (scheduleRequest.current === requestId) {
          setError(loadError?.message || 'Could not load available dates. Please try again.');
        }
      })
      .finally(() => {
        if (scheduleRequest.current === requestId) setLoadingSchedules(false);
      });
    return () => {
      if (scheduleRequest.current === requestId) scheduleRequest.current += 1;
    };
  }, [open, reloadKey, selection.showId]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  return open ? (
    <div aria-label="Book tickets" aria-modal="true" className="fixed inset-0 z-[80]" role="dialog">
      <button aria-label="Close booking drawer" className="absolute inset-0 bg-slate-950/45" onClick={onClose} type="button" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-700">Book Now</p><h2 className="text-2xl font-black">Choose show and date</h2></div>
          <button aria-label="Close booking drawer" className="h-11 w-11 rounded-full border border-cyan-100" onClick={onClose} type="button">×</button>
        </div>
        <label className="mt-8 font-black" htmlFor="booking-show">Show</label>
        <select id="booking-show" value={selection.showId} onChange={(event) => setSelection((current) => changeDrawerShow(current, event.target.value))}>
          <option value="">Choose a show</option>
          {shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}
        </select>
        <label className="mt-6 font-black" htmlFor="booking-date">Date</label>
        <select disabled={!selection.showId || loadingSchedules} id="booking-date" value={selection.date} onChange={(event) => setSelection((current) => changeDrawerDate(current, event.target.value, dates))}>
          <option value="">Choose an available date</option>
          {dates.map((date) => <option key={date} value={date}>{date}</option>)}
        </select>
        {(loadingShows || loadingSchedules) && <p aria-live="polite" role="status">Loading available shows...</p>}
        {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)}>Try Again</button></div>}
        <button className="mt-auto rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 px-6 py-4 font-black text-white disabled:opacity-40" disabled={!destination} type="button" onClick={() => { navigate(destination); onClose(); }}>Continue</button>
      </aside>
    </div>
  ) : null;
}
```

Apply the existing cyan–teal input classes from Navbar/Home to both selects. Do not add a dependency.

- [ ] **Step 6: Wire desktop and mobile Navbar Book Now to the drawer**

In `Navbar.jsx`:

- remove the `showTicketTarget` import;
- import `TicketBookingDrawer`;
- add `const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);`;
- change `handleBookNow` to close the mobile menu and set the drawer open;
- render one drawer after `</header>`.

```jsx
const handleBookNow = () => {
  closeMobileMenu();
  setBookingDrawerOpen(true);
};
```

```jsx
<TicketBookingDrawer open={bookingDrawerOpen} onClose={() => setBookingDrawerOpen(false)} />
```

Change `isHomepageRoute` to `location.pathname === '/'` because `/shows` is no longer a Home variant.

- [ ] **Step 7: Run focused tests, aggregate tests, and build**

```powershell
node --test frontend/src/shared/components/navigation/ticketBookingDrawerState.test.js frontend/src/features/cart/showDetailSchedule.test.js frontend/src/features/cart/showTicketNavigation.test.js
npm --prefix frontend test
npm --prefix frontend run build
```

Expected: focused tests pass, complete suite passes, build exits 0.

- [ ] **Step 8: Commit the Navbar drawer**

```powershell
git add frontend/src/shared/components/navigation/ticketBookingDrawerState.js frontend/src/shared/components/navigation/ticketBookingDrawerState.test.js frontend/src/shared/components/navigation/TicketBookingDrawer.jsx frontend/src/shared/components/navigation/Navbar.jsx
git commit -m "feat: choose show and date from navbar"
```

---

### Task 4: Move the Ticket Workspace into Show Detail

**Files:**

- Modify: `frontend/src/stitch-react/ShowDetailPage.jsx`
- Modify: `frontend/src/features/cart/ShowTicketWorkspace.jsx`
- Create: `frontend/src/features/cart/showDetailWorkspaceState.js`
- Create: `frontend/src/features/cart/showDetailWorkspaceState.test.js`

**Interfaces:**

- Consumes: `chooseShowDetailSchedule`, `localDateKey`, `getSchedule`, `getShowDetail`, `getShowSchedules`, and `ShowTicketWorkspace`.
- Produces: `detailWorkspaceNotice({ requestedDateUnavailable, requestedDate })`, `createWorkspaceRequestTracker()`, and a Show Detail-owned authoritative schedule flow.

- [ ] **Step 1: Write failing tests for the unavailable-date notice**

Create `showDetailWorkspaceState.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { detailWorkspaceNotice } from './showDetailWorkspaceState.js';
import { createWorkspaceRequestTracker } from './showDetailWorkspaceState.js';

test('explains that a requested date no longer has tickets', () => {
  assert.equal(
    detailWorkspaceNotice({ requestedDateUnavailable: true, requestedDate: '2026-07-17' }),
    'No tickets remain for 2026-07-17. Choose another available date or time.',
  );
});

test('does not show a date warning for the normal nearest schedule', () => {
  assert.equal(detailWorkspaceNotice({ requestedDateUnavailable: false, requestedDate: '' }), '');
});

test('a newer workspace request invalidates an older response', () => {
  const tracker = createWorkspaceRequestTracker();
  const first = tracker.begin();
  const second = tracker.begin();
  assert.equal(tracker.isCurrent(first), false);
  assert.equal(tracker.isCurrent(second), true);
  tracker.invalidate();
  assert.equal(tracker.isCurrent(second), false);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

```powershell
node --test frontend/src/features/cart/showDetailWorkspaceState.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the notice helper**

```js
export function detailWorkspaceNotice({ requestedDateUnavailable, requestedDate }) {
  return requestedDateUnavailable && requestedDate
    ? `No tickets remain for ${requestedDate}. Choose another available date or time.`
    : '';
}

export function createWorkspaceRequestTracker() {
  let current = 0;
  return {
    begin() {
      current += 1;
      return current;
    },
    invalidate() {
      current += 1;
    },
    isCurrent(requestId) {
      return current === requestId;
    },
  };
}
```

- [ ] **Step 4: Run the notice test and confirm GREEN**

Run the Step 2 command.

Expected: 3 tests pass.

- [ ] **Step 5: Make Show Detail own the workspace schedule lifecycle**

In `ShowDetailPage.jsx`:

- import `useLocation`, `ShowTicketWorkspace`, `chooseShowDetailSchedule`, `localDateKey`, `detailWorkspaceNotice`, and `getSchedule`;
- remove the old local calendar/date filtering functions, `availabilityFor`, `formatTimeRange`, `formatCurrency`, orange booking-action CSS, and Upcoming Times card state/markup;
- add state for `selectedSchedule`, `workspaceLoading`, `workspaceError`, `workspaceNotice` and a `workspaceRequest` ref initialized with `createWorkspaceRequestTracker()`;
- read `requestedDate` from `new URLSearchParams(location.search).get('date') || ''`;
- after `getShowDetail` and `getShowSchedules`, call `chooseShowDetailSchedule(list, requestedDate)` and fetch the chosen authoritative detail with `getSchedule`;
- use `workspaceRequest.current.begin()` before each request, guard every completion with `workspaceRequest.current.isCurrent(requestId)` and the effect `active` flag, and call `invalidate()` in cleanup;
- set the notice using `detailWorkspaceNotice`;
- when the location hash is `#ticket-workspace`, scroll to the section after the workspace snapshot settles.

The central selection sequence must be:

```js
const choice = chooseShowDetailSchedule(list, requestedDate);
const authoritative = choice.schedule
  ? await getSchedule(choice.schedule.id || choice.schedule.scheduleId)
  : null;
if (!active || !workspaceRequest.current.isCurrent(requestId)) return;
setShow(detail);
setSchedules(list);
setSelectedSchedule(authoritative);
setWorkspaceNotice(detailWorkspaceNotice({
  requestedDateUnavailable: choice.requestedDateUnavailable,
  requestedDate: choice.effectiveDate,
}));
```

Implement `handleWorkspaceScheduleChange(scheduleId)` with the same request-id pattern. After loading the authoritative schedule, update the URL date and hash without losing the show id:

```js
const date = localDateKey(authoritative.startTime);
navigate(`/shows/${encodeURIComponent(String(show.id))}?date=${date}#ticket-workspace`);
```

- [ ] **Step 6: Replace Upcoming Times with the workspace**

After the About the Show card, render:

```jsx
<ShowTicketWorkspace
  error={workspaceError}
  loading={workspaceLoading}
  notice={workspaceNotice}
  schedule={selectedSchedule}
  schedules={schedules}
  selectedScheduleId={selectedSchedule?.id || selectedSchedule?.scheduleId || ''}
  show={show}
  onRetry={() => setReloadKey((key) => key + 1)}
  onScheduleChange={handleWorkspaceScheduleChange}
/>
```

Change Show Detail breadcrumbs and error-state Back links from `/shows` to `/#shows`.

- [ ] **Step 7: Make the shared workspace explicitly show-specific**

In `ShowTicketWorkspace.jsx`:

- add `notice = ''` to props;
- change the eyebrow from `Upcoming Times` to `Select Tickets`;
- remove fallback copy that says `Choose your show` or `Select a show`;
- show `show.title` when no schedule exists;
- render `notice` as an inline live warning above the content state;
- keep existing cart confirmation and lifecycle logic unchanged.

Use:

```jsx
{notice && (
  <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900" role="status">
    {notice}
  </p>
)}
```

The empty state must say:

```jsx
<h3 className="mt-3 text-2xl font-black text-slate-950">No upcoming schedules</h3>
<p className="mx-auto mt-2 max-w-xl text-slate-600">
  This show does not currently have a future schedule with tickets available.
</p>
```

When `notice` is present and `bookableSchedules` is non-empty, the empty state must also render alternatives so an unavailable requested date is recoverable without switching shows:

```jsx
{notice && bookableSchedules.length > 0 && (
  <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
    {bookableSchedules.map((item) => {
      const itemId = scheduleId(item);
      return (
        <button
          className="rounded-2xl border border-cyan-200 bg-white p-4 text-left transition hover:border-cyan-500 hover:bg-cyan-50"
          key={itemId}
          type="button"
          onClick={() => onScheduleChange(itemId)}
        >
          <span className="block font-black text-slate-950">{formatDate(item.startTime)}</span>
          <span className="mt-1 block text-sm font-bold text-cyan-700">{formatTime(item.startTime)}</span>
        </button>
      );
    })}
  </div>
)}
```

- [ ] **Step 8: Run focused tests, all cart tests, aggregate suite, and build**

```powershell
node --test frontend/src/features/cart/showDetailSchedule.test.js frontend/src/features/cart/showDetailWorkspaceState.test.js frontend/src/features/cart/showTicketWorkspaceState.test.js frontend/src/features/cart/ticketCartConfirmation.test.js frontend/src/features/cart/ticketSelectorState.test.js
npm --prefix frontend test
npm --prefix frontend run build
```

Expected: all tests pass and build exits 0.

- [ ] **Step 9: Commit Show Detail ownership**

```powershell
git add frontend/src/stitch-react/ShowDetailPage.jsx frontend/src/features/cart/ShowTicketWorkspace.jsx frontend/src/features/cart/showDetailWorkspaceState.js frontend/src/features/cart/showDetailWorkspaceState.test.js
git commit -m "feat: select tickets from show details"
```

---

### Task 5: Remove Ticket Workspace Ownership from Home

**Files:**

- Modify: `frontend/src/features/home/HomePage.jsx`
- Delete: `frontend/src/features/home/ticketWorkspaceRoute.js`
- Delete: `frontend/src/features/home/ticketWorkspaceRoute.test.js`

**Interfaces:**

- Consumes: `showTicketTarget({ showId }) -> string`.
- Produces: Home as a catalog-only page with show-specific Book Now navigation.

- [ ] **Step 1: Add a failing static ownership test**

Create a temporary test file `frontend/src/features/home/homeTicketOwnership.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./HomePage.jsx', import.meta.url), 'utf8');

test('Home does not import or render the ticket workspace', () => {
  assert.equal(source.includes('ShowTicketWorkspace'), false);
  assert.equal(source.includes('createTicketWorkspaceResolution'), false);
  assert.equal(source.includes('<ShowTicketWorkspace'), false);
});

test('Home show cards navigate booking to show detail', () => {
  assert.match(source, /showTicketTarget\(\{\s*showId:/);
});
```

- [ ] **Step 2: Run the static test and confirm RED**

```powershell
node --test frontend/src/features/home/homeTicketOwnership.test.js
```

Expected: FAIL because Home still imports/renders the workspace.

- [ ] **Step 3: Remove Home workspace state and effects**

Remove from `HomePage.jsx`:

- `ShowTicketWorkspace`, `getSchedule`, `getShowDetail`, `getShowSchedules`, `chooseBookableSchedule`, and `createTicketWorkspaceResolution` imports used only by the workspace;
- `selectedShowId`, `workspaceShow`, `workspaceSchedules`, `workspaceSchedule`, `workspaceLoading`, `workspaceError`, request/retry/location refs;
- `handleBookingShowChange`, `activateTicketWorkspace`, `handleWorkspaceScheduleChange`, `runTicketWorkspaceResolution`, and its route-state effect;
- the `<ShowTicketWorkspace ... />` block.

Keep show fetching, search, pagination, show cards, and upcoming marketing schedules.

- [ ] **Step 4: Route show-card Book Now directly to detail**

Keep `showTicketTarget` imported and replace `goToTicketWorkspace` with:

```js
const goToShowTickets = (show) => {
  navigate(showTicketTarget({ showId: show?.id }));
};
```

Update the card action:

```jsx
<button
  className="rounded-full bg-cyan-700 py-3.5 text-center font-bold text-white transition hover:bg-cyan-800 disabled:opacity-40"
  disabled={!show.nextScheduleId}
  type="button"
  onClick={() => goToShowTickets(show)}
>
  Book Now
</button>
```

Change generic promotion links from `/shows` to `/#shows`.

- [ ] **Step 5: Delete the obsolete generic resolution module**

Delete both `ticketWorkspaceRoute.js` and `ticketWorkspaceRoute.test.js`. Confirm no import remains:

```powershell
rg -n "ticketWorkspaceRoute|createTicketWorkspaceResolution|resolveNearestBookableWorkspace" frontend/src
```

Expected: no matches.

- [ ] **Step 6: Run the ownership test and complete suite**

```powershell
node --test frontend/src/features/home/homeTicketOwnership.test.js frontend/src/features/cart/showTicketNavigation.test.js
npm --prefix frontend test
npm --prefix frontend run build
```

Expected: ownership tests pass, complete suite passes, build exits 0.

- [ ] **Step 7: Commit the Home cleanup**

```powershell
git add frontend/src/features/home/HomePage.jsx frontend/src/features/home/homeTicketOwnership.test.js
git rm frontend/src/features/home/ticketWorkspaceRoute.js frontend/src/features/home/ticketWorkspaceRoute.test.js
git commit -m "refactor: keep home focused on show discovery"
```

---

### Task 6: Update Generic Catalog Links and Compatibility Copy

**Files:**

- Modify: `frontend/src/shared/components/navigation/Footer.jsx`
- Modify: `frontend/src/features/profile/ProfilePage.jsx`
- Modify: `frontend/src/features/booking/CreateBookingPage.jsx`
- Modify: `frontend/src/features/booking/BookingHistoryPage.jsx`
- Modify: `frontend/src/shared/components/navigation/Navbar.jsx`
- Modify: `frontend/src/stitch-react/ShowDetailPage.jsx`

**Interfaces:**

- Consumes: `SHOW_CATALOG_TARGET` from `showTicketNavigation.js` where a JavaScript constant is convenient.
- Produces: no user-facing generic action points at the removed standalone page.

- [ ] **Step 1: Write a failing static link audit test**

Create `frontend/src/features/cart/showCatalogLinks.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  '../../shared/components/navigation/Footer.jsx',
  '../profile/ProfilePage.jsx',
  '../booking/CreateBookingPage.jsx',
  '../booking/BookingHistoryPage.jsx',
  '../../stitch-react/ShowDetailPage.jsx',
];

test('generic booking links do not target the removed standalone shows page', () => {
  for (const relativePath of files) {
    const source = fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    assert.equal(source.includes('to="/shows"'), false, relativePath);
    assert.equal(source.includes("to: '/shows'"), false, relativePath);
  }
});
```

- [ ] **Step 2: Run the audit and confirm RED**

```powershell
node --test frontend/src/features/cart/showCatalogLinks.test.js
```

Expected: FAIL for current `/shows` generic links.

- [ ] **Step 3: Change generic links to the Home catalog**

Use `/#shows` for:

- Footer `Book Tickets`;
- Profile `Book New Ticket`;
- Create Booking `Add More Tickets` and `Browse Shows`;
- Booking History generic browse/book action;
- Show Detail Back to shows and breadcrumb.

Do not change:

- `CartItemCard` `/shows/${line.showId}`;
- manager View public details `/shows/${show.id}`;
- router detail paths.

In Navbar and Footer, keep `isHomepageRoute` equal to `location.pathname === '/'`.

- [ ] **Step 4: Run the audit and search all route references**

```powershell
node --test frontend/src/features/cart/showCatalogLinks.test.js
rg -n "/shows" frontend/src
```

Expected: audit passes. Remaining `/shows` references are only detail paths, redirect route declarations, API endpoints, and tests asserting the detail URL.

- [ ] **Step 5: Run the complete frontend verification**

```powershell
npm --prefix frontend test
npm --prefix frontend run build
```

Expected: all tests pass and build exits 0.

- [ ] **Step 6: Commit the catalog link migration**

```powershell
git add frontend/src/shared/components/navigation/Footer.jsx frontend/src/features/profile/ProfilePage.jsx frontend/src/features/booking/CreateBookingPage.jsx frontend/src/features/booking/BookingHistoryPage.jsx frontend/src/shared/components/navigation/Navbar.jsx frontend/src/stitch-react/ShowDetailPage.jsx frontend/src/features/cart/showCatalogLinks.test.js
git commit -m "refactor: send generic booking links to home catalog"
```

---

### Task 7: Full Verification and Manual Acceptance

**Files:**

- Modify only if verification exposes a defect; add its regression test beside the owning pure helper.

**Interfaces:**

- Verifies the integrated route, drawer, detail workspace, cart, and compatibility behavior.

- [ ] **Step 1: Run the entire frontend test suite**

```powershell
npm --prefix frontend test
```

Expected: zero failed tests.

- [ ] **Step 2: Run the production build**

```powershell
npm --prefix frontend run build
```

Expected: Vite exits 0. The existing large-chunk warning is permitted; compilation errors are not.

- [ ] **Step 3: Run static cleanup checks**

```powershell
rg -n "ShowTicketWorkspace|ticketWorkspaceRoute|createTicketWorkspaceResolution" frontend/src/features/home
rg -n "to=\"/shows\"|to: '/shows'" frontend/src
rg -n "Choose your show|Select a show to get started" frontend/src/features/cart frontend/src/stitch-react
git diff --check
git status --short
```

Expected:

- no Home workspace ownership matches;
- no generic standalone `/shows` links;
- no show-picker copy inside the fixed-show ticket workspace;
- no whitespace errors;
- only intended task changes before final commit/review.

- [ ] **Step 4: Run browser acceptance at `http://localhost:5173`**

Start:

```powershell
npm --prefix frontend run dev
```

Verify in order:

1. `/shows` and `/public/shows` redirect to `/`.
2. Home does not render the ticket workspace.
3. Navbar Book Now opens the right drawer on desktop and mobile.
4. Changing show clears date; only bookable dates appear.
5. Continue opens `/shows/:showId?date=YYYY-MM-DD#ticket-workspace`.
6. Show Detail replaces Upcoming Times cards with the ticket workspace.
7. The earliest bookable schedule in the chosen date is selected.
8. An unavailable requested date stays on the same show and offers another date.
9. Ticket Select, right-side quantities, inventory reconciliation, and Add to Cart work.
10. Add to Cart & Continue reaches `/bookings/create`.
11. Footer/Profile/booking generic actions return to `/#shows`.
12. `/public/shows/:showId` still renders Show Detail.

If the browser runtime cannot initialize, record the exact error and do not claim manual acceptance passed.

- [ ] **Step 5: Review the full branch diff**

```powershell
git log --oneline --decorate -8
git diff --stat HEAD~6..HEAD
git diff --check HEAD~6..HEAD
```

Expected: task commits are present and the branch is clean.

---

## Execution Notes

- Execute tasks in order because the drawer and Show Detail integrations consume the navigation/date helpers.
- Use a separate reviewer gate after every task.
- Preserve the existing cart confirmation module unless a failing regression proves a relocation defect.
- Do not resurrect `TicketSearchDrawer.jsx`; the new `TicketBookingDrawer.jsx` is intentionally navigation-only.
- Push only after the final reviewer approves the complete branch.
