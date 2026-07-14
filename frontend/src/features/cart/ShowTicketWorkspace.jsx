import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getSchedule } from '../../services/showService.js';
import { formatCurrency, getTicketTypeLabel } from '../../shared/utils/ticketPricing.js';
import { useCart } from './CartContext.jsx';
import { ticketWorkspaceContentState } from './showTicketWorkspaceState.js';
import {
  createSelectorState,
  isScheduleBookable,
  reconcileSelectorState,
  SELECTOR_TICKET_TYPES,
  selectSchedule,
  selectTicketType,
  selectedTicketSummary,
  setTypeQuantity,
  ticketTypeAvailability,
} from './ticketSelectorState.js';

function scheduleId(schedule) {
  return String(schedule?.id || schedule?.scheduleId || '');
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Date to be announced';
}

function formatTime(value) {
  const date = toDate(value);
  return date ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBA';
}

function ticketPrice(schedule, type) {
  return Number(schedule?.[`${type.toLowerCase()}Price`]) || 0;
}

function totalAvailability(schedule) {
  return SELECTOR_TICKET_TYPES.reduce(
    (total, type) => total + ticketTypeAvailability(schedule, type).available,
    0,
  );
}

export default function ShowTicketWorkspace({
  show,
  schedules = [],
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
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState('');

  useEffect(() => {
    setState((current) => selectSchedule(current, selectedScheduleId));
    setCartError('');
  }, [selectedScheduleId]);

  const summary = useMemo(() => selectedTicketSummary(schedule, state), [schedule, state]);
  const contentState = ticketWorkspaceContentState({ loading, error, schedule });
  const bookableSchedules = useMemo(
    () => schedules.filter((item) => isScheduleBookable(item)),
    [schedules],
  );
  const changeQuantity = (type, delta) => {
    setCartError('');
    const availability = ticketTypeAvailability(schedule, type);
    setState((current) => setTypeQuantity(
      current,
      type,
      Number(current.quantities[type] || 0) + delta,
      availability.available,
    ));
  };

  const handleAddToCart = async () => {
    if (addingToCart || summary.lines.length === 0) return;
    const currentScheduleId = scheduleId(schedule);
    if (!currentScheduleId) return;
    setAddingToCart(true);
    setCartError('');
    try {
      const freshSchedule = await getSchedule(currentScheduleId);
      const reconciledState = reconcileSelectorState(state, freshSchedule);
      const freshSummary = selectedTicketSummary(freshSchedule, reconciledState);
      setState(reconciledState);
      if (freshSummary.lines.length === 0) {
        setCartError('Those tickets are no longer available. Select an available ticket type and try again.');
        return;
      }
      addItems(freshSummary.lines);
      navigate('/bookings/create');
    } catch {
      setCartError('Could not confirm current ticket availability. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <section className="scroll-mt-24 bg-cyan-50/60 py-16" id="ticket-workspace" aria-label="Select show tickets">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-700">Upcoming Times</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {schedule ? formatDate(schedule.startTime) : show?.title || 'Choose your show'}
            </h2>
          </div>
          <p className="max-w-xl text-sm font-semibold text-slate-600">
            {show ? `Select tickets for ${show.title}. Quantities are managed in your summary.` : 'Choose a show above to see its nearest available time.'}
          </p>
        </div>

        {contentState === 'loading' ? (
          <div aria-busy="true" aria-live="polite" className="rounded-[2rem] border border-cyan-100 bg-white p-12 text-center shadow-sm" role="status">
            <div aria-hidden="true" className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-700" />
            <p className="mt-4 font-black text-cyan-800">Loading live schedule availability...</p>
          </div>
        ) : contentState === 'error' ? (
          <div className="rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-red-500">error</span>
            <p className="mt-3 font-bold text-red-700">{error}</p>
            <button className="mt-5 rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 px-7 py-3 font-black text-white" type="button" onClick={onRetry}>
              Try Again
            </button>
          </div>
        ) : contentState === 'empty' ? (
          <div className="rounded-[2rem] border border-cyan-100 bg-white p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-cyan-700">event_busy</span>
            <h3 className="mt-3 text-2xl font-black text-slate-950">
              {show ? 'No upcoming schedules' : 'Select a show to get started'}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              {show ? 'This show does not currently have a future schedule with tickets available.' : 'Use any Book Now action or the show picker above.'}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid flex-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Time</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Venue</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{schedule.venueName || show?.venueName || 'Venue TBA'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Availability</p>
                    <p className="mt-1 text-lg font-black text-teal-700">{totalAvailability(schedule)} tickets available</p>
                  </div>
                </div>
                <button
                  aria-controls="ticket-workspace-calendar"
                  aria-expanded={calendarOpen}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 px-7 py-3.5 font-black text-white shadow-lg shadow-cyan-950/10 transition hover:brightness-95"
                  type="button"
                  onClick={() => setCalendarOpen((open) => !open)}
                >
                  <span className="material-symbols-outlined">calendar_month</span>
                  View Calendar
                </button>
              </div>

              {calendarOpen && (
                <div className="mt-6 border-t border-cyan-100 pt-5" id="ticket-workspace-calendar">
                  <p className="mb-3 text-sm font-black text-slate-700">Choose another available time</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {bookableSchedules.map((item) => {
                      const itemId = scheduleId(item);
                      const selected = itemId === String(selectedScheduleId || '');
                      return (
                        <button
                          className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-cyan-600 bg-cyan-50 text-cyan-950' : 'border-cyan-100 bg-white hover:border-cyan-400'} disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400`}
                          disabled={selected}
                          key={itemId}
                          type="button"
                          onClick={() => onScheduleChange(itemId)}
                        >
                          <span className="block font-black">{formatDate(item.startTime)}</span>
                          <span className="mt-1 block text-sm font-bold">{formatTime(item.startTime)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-4">
                {SELECTOR_TICKET_TYPES.map((type) => {
                  const availability = ticketTypeAvailability(schedule, type);
                  const quantity = Number(state.quantities[type]) || 0;
                  const label = getTicketTypeLabel(type);
                  return (
                    <article className={`flex flex-col gap-5 rounded-[1.75rem] border p-6 sm:flex-row sm:items-center sm:justify-between ${availability.disabled ? 'border-slate-100 bg-slate-50' : 'border-cyan-100 bg-white shadow-sm'}`} key={type}>
                      <div>
                        <h3 className="text-xl font-black text-slate-950">{label}</h3>
                        <p className="mt-1 text-lg font-black text-cyan-700">{formatCurrency(ticketPrice(schedule, type))}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{availability.available} available</p>
                      </div>
                      <button
                        className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 px-7 py-3 font-black text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-500"
                        disabled={availability.disabled || quantity > 0}
                        type="button"
                        onClick={() => {
                          setCartError('');
                          setState((current) => selectTicketType(current, type, schedule));
                        }}
                      >
                        {availability.disabled ? 'Sold Out' : quantity > 0 ? `${label} selected` : 'Select'}
                      </button>
                    </article>
                  );
                })}
              </div>

              <aside className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-xl shadow-cyan-950/10 lg:sticky lg:top-24" aria-label="Selected tickets">
                <h3 className="text-2xl font-black text-slate-950">Selected Tickets</h3>
                {summary.lines.length === 0 ? (
                  <div className="py-10 text-center">
                    <span className="material-symbols-outlined text-5xl text-cyan-200">confirmation_number</span>
                    <p className="mt-3 font-bold text-slate-500">Select a ticket type to add it here.</p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-5">
                    {summary.lines.map((line) => {
                      const label = getTicketTypeLabel(line.ticketType);
                      const availability = ticketTypeAvailability(schedule, line.ticketType);
                      return (
                        <div className="border-b border-cyan-100 pb-5 last:border-0" key={line.ticketType}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-black text-slate-950">{label}</p>
                              <p className="text-sm font-semibold text-slate-500">{formatCurrency(line.unitPrice)} each</p>
                            </div>
                            <p className="font-black text-cyan-700">{formatCurrency(line.lineTotal)}</p>
                          </div>
                          <div className="mt-4 flex items-center gap-3">
                            <button aria-label={`Decrease ${label} quantity`} className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300 font-black text-cyan-800 transition hover:bg-cyan-50" type="button" onClick={() => changeQuantity(line.ticketType, -1)}>
                              <span className="material-symbols-outlined text-lg">remove</span>
                            </button>
                            <span className="w-8 text-center font-black text-slate-950">{line.quantity}</span>
                            <button aria-label={`Increase ${label} quantity`} className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 font-black text-white disabled:cursor-not-allowed disabled:opacity-35" disabled={line.quantity >= availability.maximum} type="button" onClick={() => changeQuantity(line.ticketType, 1)}>
                              <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 space-y-3 border-t border-cyan-100 pt-5">
                  <div className="flex justify-between text-sm font-bold text-slate-600"><span>Tickets</span><span>{summary.totalQuantity}</span></div>
                  <div className="flex items-end justify-between gap-4"><span className="font-black text-slate-950">Temporary total</span><span className="text-2xl font-black text-cyan-700">{formatCurrency(summary.totalAmount)}</span></div>
                  {cartError && <p className="text-sm font-bold text-red-700" role="alert">{cartError}</p>}
                  <button className="w-full rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 px-6 py-4 font-black text-white shadow-lg shadow-cyan-950/15 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40" disabled={addingToCart || summary.lines.length === 0} type="button" onClick={handleAddToCart}>
                    {addingToCart ? 'Confirming Availability...' : 'Add to Cart & Continue'}
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
