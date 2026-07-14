import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getSchedule } from '../../services/showService.js';
import { formatCurrency, getTicketTypeLabel } from '../../shared/utils/ticketPricing.js';
import { useCart } from './CartContext.jsx';
import {
  confirmTicketSelection,
  createConfirmationLifecycle,
} from './ticketCartConfirmation.js';
import { ticketWorkspaceContentState } from './showTicketWorkspaceState.js';
import {
  createSelectorState,
  isScheduleBookable,
  SELECTOR_TICKET_TYPES,
  selectSchedule,
  selectedTicketSummary,
  getTotalQuantity,
  setTypeAgeQuantity,
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
  notice = '',
  onScheduleChange,
  onRetry,
}) {
  const { addItems } = useCart();
  const navigate = useNavigate();
  const [state, setState] = useState(() => createSelectorState(selectedScheduleId));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const [authoritativeSchedule, setAuthoritativeSchedule] = useState(schedule);
  const [expandedCard, setExpandedCard] = useState(null);
  const selectionVersion = useRef(0);
  const confirmationLifecycle = useRef(null);
  if (!confirmationLifecycle.current) {
    confirmationLifecycle.current = createConfirmationLifecycle();
  }
  const displayedSchedule = scheduleId(authoritativeSchedule) === String(selectedScheduleId || '')
    ? authoritativeSchedule
    : schedule;
  const scheduleIntent = useRef(scheduleId(displayedSchedule));
  scheduleIntent.current = scheduleId(displayedSchedule);

  useEffect(() => {
    confirmationLifecycle.current.activate();
    return () => confirmationLifecycle.current.dispose();
  }, []);

  useEffect(() => {
    selectionVersion.current += 1;
    confirmationLifecycle.current.invalidate();
    setAddingToCart(false);
    setAuthoritativeSchedule(schedule);
    setState((current) => selectSchedule(current, selectedScheduleId));
    setCartError('');
  }, [schedule, selectedScheduleId]);

  const summary = useMemo(
    () => selectedTicketSummary(displayedSchedule, state),
    [displayedSchedule, state],
  );
  const contentState = ticketWorkspaceContentState({ loading, error, schedule: displayedSchedule });
  const bookableSchedules = useMemo(
    () => schedules.filter((item) => isScheduleBookable(item)),
    [schedules],
  );
  const changeAgeQuantity = (type, ageType, newQuantity) => {
    if (addingToCart) return;
    selectionVersion.current += 1;
    setCartError('');
    const availability = ticketTypeAvailability(displayedSchedule, type);
    setState((current) => setTypeAgeQuantity(
      current,
      type,
      ageType,
      newQuantity,
      availability.available,
    ));
  };

  const handleAddToCart = async () => {
    if (addingToCart || summary.lines.length === 0) return;
    const currentScheduleId = scheduleId(displayedSchedule);
    if (!currentScheduleId) return;
    const operationId = confirmationLifecycle.current.begin();
    const intentVersion = selectionVersion.current;
    setAddingToCart(true);
    setCartError('');
    try {
      const result = await confirmTicketSelection({
        schedule: displayedSchedule,
        state,
        loadSchedule: getSchedule,
        isCurrent: () => (
          confirmationLifecycle.current.isCurrent(operationId)
          && selectionVersion.current === intentVersion
          && scheduleIntent.current === currentScheduleId
        ),
        commit: (lines) => {
          addItems(lines);
          navigate('/bookings/create');
        },
      });
      if (result.status === 'changed') {
        selectionVersion.current += 1;
        setAuthoritativeSchedule(result.schedule);
        setState(result.state);
        setCartError(result.notice);
        return;
      }
    } catch {
      if (confirmationLifecycle.current.isCurrent(operationId)) {
        setCartError('Could not confirm current ticket availability. Please try again.');
      }
    } finally {
      if (confirmationLifecycle.current.isCurrent(operationId)) setAddingToCart(false);
    }
  };

  return (
    <section className="scroll-mt-24 bg-cyan-50/60 py-16" id="ticket-workspace" aria-label="Select show tickets">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-700">Select Tickets</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {displayedSchedule ? formatDate(displayedSchedule.startTime) : show?.title}
            </h2>
          </div>
          <p className="max-w-xl text-sm font-semibold text-slate-600">
            {show ? `Select tickets for ${show.title}. Quantities are managed in your summary.` : ''}
          </p>
        </div>

        {notice && (
          <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900" role="status">
            {notice}
          </p>
        )}

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
            <h3 className="mt-3 text-2xl font-black text-slate-950">No upcoming schedules</h3>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              This show does not currently have a future schedule with tickets available.
            </p>
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
          </div>
        ) : (
          <>
            <div className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid flex-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Time</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{formatTime(displayedSchedule.startTime)} – {formatTime(displayedSchedule.endTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Venue</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{displayedSchedule.venueName || show?.venueName || 'Venue TBA'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Availability</p>
                    <p className="mt-1 text-lg font-black text-teal-700">{totalAvailability(displayedSchedule)} tickets available</p>
                  </div>
                </div>
                <button
                  aria-controls="ticket-workspace-calendar"
                  aria-expanded={calendarOpen}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 px-7 py-3.5 font-black text-white shadow-lg shadow-cyan-950/10 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={addingToCart}
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
                          disabled={addingToCart || selected}
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
                  const availability = ticketTypeAvailability(displayedSchedule, type);
                  const quantities = state.quantities[type] || { adult: 0, child: 0, senior: 0 };
                  const totalQty = getTotalQuantity(quantities);
                  const label = getTicketTypeLabel(type);
                  const isExpanded = expandedCard === type;

                  return (
                    <article className={`flex flex-col gap-5 rounded-[1.75rem] border p-6 ${availability.disabled ? 'border-slate-100 bg-slate-50' : 'border-cyan-100 bg-white shadow-sm hover:border-cyan-300'} transition cursor-pointer`} key={type} onClick={() => !availability.disabled && setExpandedCard(type)}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                        <div>
                          <h3 className="text-xl font-black text-slate-950">{label}</h3>
                          <p className="mt-1 text-lg font-black text-cyan-700">{formatCurrency(ticketPrice(displayedSchedule, type))}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-500">{availability.available} available</p>
                        </div>
                        <button
                          className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 px-7 py-3 font-black text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-500"
                          disabled={addingToCart || availability.disabled}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (addingToCart || availability.disabled) return;
                            setExpandedCard(type);
                          }}
                        >
                          {availability.disabled ? 'Sold Out' : totalQty > 0 ? `${totalQty} selected` : 'Select'}
                        </button>
                      </div>
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
                      const availability = ticketTypeAvailability(displayedSchedule, line.ticketType);
                      return (
                        <div className="border-b border-cyan-100 pb-5 last:border-0" key={line.ticketType}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-black text-slate-950">{label}</p>
                              <p className="text-sm font-semibold text-slate-500">{formatCurrency(line.unitPrice)} each</p>
                            </div>
                            <p className="font-black text-cyan-700">{formatCurrency(line.lineTotal)}</p>
                          </div>
                          <div className="mt-3 text-sm text-slate-600 space-y-1">
                            {line.ages.adult > 0 && <div>Adult: <span className="font-bold text-slate-950">{line.ages.adult}</span></div>}
                            {line.ages.child > 0 && <div>Child: <span className="font-bold text-slate-950">{line.ages.child}</span></div>}
                            {line.ages.senior > 0 && <div>Senior: <span className="font-bold text-slate-950">{line.ages.senior}</span></div>}
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
                    {addingToCart ? 'Confirming Availability...' : 'Continue'}
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {expandedCard && (
        <div aria-label="Select Ages" aria-modal="true" className="fixed inset-0 z-[80]" role="dialog">
          <button aria-label="Close drawer" className="absolute inset-0 bg-slate-950/45" onClick={() => setExpandedCard(null)} type="button" />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 mb-1">[{show?.title}]</p>
                <h2 className="text-2xl font-black text-slate-900 pr-4">{getTicketTypeLabel(expandedCard)} Admission Ticket to Wave Park</h2>
              </div>
              <button aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition" onClick={() => setExpandedCard(null)} type="button">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            <div className="flex flex-col flex-1">
              <h3 className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                <span className="material-symbols-outlined">group</span>
                Quantity to purchase
              </h3>
              
              <div className="space-y-4">
                {['adult', 'child', 'senior'].map((ageType) => {
                  const ageLabel = ageType === 'adult' ? 'Adult' : ageType === 'child' ? 'Child' : 'Senior';
                  const ageDesc = ageType === 'adult' ? 'Over 140cm' : ageType === 'child' ? '80-139cm' : 'Over 60 years old';
                  const icon = ageType === 'child' ? 'child_care' : 'person';
                  const quantities = state.quantities[expandedCard] || { adult: 0, child: 0, senior: 0 };
                  const qty = quantities[ageType] || 0;
                  const unitPrice = ticketPrice(displayedSchedule, expandedCard);
                  const availability = ticketTypeAvailability(displayedSchedule, expandedCard);
                  const totalQty = getTotalQuantity(quantities);
                  
                  return (
                    <div key={ageType} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 p-4 hover:border-cyan-200 transition">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-3xl text-slate-400">{icon}</span>
                        <div>
                          <p className="font-bold text-slate-900">{ageLabel}</p>
                          <p className="text-xs text-slate-400">{ageDesc}</p>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex flex-1 items-center justify-between sm:justify-end gap-3 sm:gap-6">
                        <span className="font-bold text-slate-700 whitespace-nowrap">~{formatCurrency(unitPrice)}</span>
                        <div className="flex items-center gap-3">
                          <button aria-label={`Decrease ${ageLabel}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-35" disabled={addingToCart || qty <= 0} type="button" onClick={() => changeAgeQuantity(expandedCard, ageType, qty - 1)}>
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="w-6 text-center font-bold text-slate-900">{qty}</span>
                          <button aria-label={`Increase ${ageLabel}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-35" disabled={addingToCart || totalQty >= availability.maximum} type="button" onClick={() => changeAgeQuantity(expandedCard, ageType, qty + 1)}>
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-8 border-t border-slate-100 pt-6 flex items-center justify-between">
              <div className="font-black text-2xl text-orange-600">
                 {formatCurrency((getTotalQuantity(state.quantities[expandedCard] || {}) || 0) * ticketPrice(displayedSchedule, expandedCard))}
              </div>
              <div className="flex items-center gap-3">
                <button className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-cyan-600 transition" type="button" onClick={() => setExpandedCard(null)}>
                  <span className="material-symbols-outlined">shopping_cart</span>
                </button>
                <button className="rounded-full bg-slate-100 px-8 py-3 font-bold text-slate-400 hover:bg-cyan-600 hover:text-white transition" type="button" onClick={() => setExpandedCard(null)}>
                  Done
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
