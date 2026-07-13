import { useEffect, useMemo, useState } from 'react';

import { getSchedule } from '../../services/showService.js';
import { formatCurrency, getTicketTypeLabel } from '../../shared/utils/ticketPricing.js';
import { useCart } from './CartContext.jsx';
import {
  buildCartItem,
  createSelectorState,
  SELECTOR_TICKET_TYPES,
  selectSchedule,
  setTypeQuantity,
  ticketTypeAvailability,
} from './ticketSelectorState.js';

function scheduleLabel(schedule) {
  const start = new Date(schedule?.startTime);
  if (Number.isNaN(start.getTime())) return 'Schedule time unavailable';
  return start.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function errorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Could not load ticket availability.';
}

export default function TicketSelector({ show, schedules = [], onClose }) {
  const { addItem } = useCart();
  const firstScheduleId = schedules[0]?.id || schedules[0]?.scheduleId || '';
  const [state, setState] = useState(() => createSelectorState(firstScheduleId));
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const availableIds = new Set(schedules.map((item) => String(item.id || item.scheduleId)));
    setState((current) => (
      availableIds.has(current.scheduleId)
        ? current
        : createSelectorState(firstScheduleId)
    ));
  }, [firstScheduleId, schedules]);

  useEffect(() => {
    if (!state.scheduleId) {
      setSchedule(null);
      return undefined;
    }
    let active = true;
    setIsLoading(true);
    setError('');
    setNotice('');
    getSchedule(state.scheduleId)
      .then((response) => active && setSchedule(response))
      .catch((loadError) => {
        if (active) {
          setSchedule(null);
          setError(errorMessage(loadError));
        }
      })
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [state.scheduleId]);

  const selectedLines = useMemo(() => SELECTOR_TICKET_TYPES
    .filter((type) => Number(state.quantities[type]) > 0), [state.quantities]);
  const total = selectedLines.reduce((sum, type) => {
    const priceField = `${type.toLowerCase()}Price`;
    return sum + Number(schedule?.[priceField] || 0) * state.quantities[type];
  }, 0);

  const changeQuantity = (type, delta) => {
    const availability = ticketTypeAvailability(schedule, type);
    setState((current) => setTypeQuantity(
      current,
      type,
      Number(current.quantities[type] || 0) + delta,
      availability.available,
    ));
    setNotice('');
  };

  const handleAdd = () => {
    if (!schedule || selectedLines.length === 0) return;
    selectedLines.forEach((type) => {
      const availability = ticketTypeAvailability(schedule, type);
      addItem(buildCartItem(schedule, type, state.quantities[type]), availability.maximum);
    });
    setNotice('Added to cart');
    setState((current) => ({ ...current, quantities: createSelectorState(current.scheduleId).quantities }));
  };

  return (
    <section className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-2xl shadow-cyan-950/10 sm:p-8" aria-label="Select show tickets">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Select Tickets</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{show?.title || 'Choose your tickets'}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Pick a schedule, ticket types, and quantities.</p>
        </div>
        {onClose && (
          <button aria-label="Close ticket selector" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <label className="block text-sm font-bold text-slate-700" htmlFor="ticket-selector-schedule">Schedule</label>
      <select
        className="mt-2 w-full rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
        id="ticket-selector-schedule"
        value={state.scheduleId}
        onChange={(event) => setState((current) => selectSchedule(current, event.target.value))}
      >
        {schedules.length === 0 && <option value="">No active schedules</option>}
        {schedules.map((item) => (
          <option key={item.id || item.scheduleId} value={item.id || item.scheduleId}>{scheduleLabel(item)}</option>
        ))}
      </select>

      {isLoading ? (
        <div className="py-10 text-center font-bold text-cyan-700">Loading live availability...</div>
      ) : error ? (
        <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>
      ) : schedule ? (
        <div className="mt-6 space-y-3">
          {SELECTOR_TICKET_TYPES.map((type) => {
            const availability = ticketTypeAvailability(schedule, type);
            const price = Number(schedule[`${type.toLowerCase()}Price`]) || 0;
            const quantity = state.quantities[type] || 0;
            return (
              <div className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${availability.disabled ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-cyan-100 bg-white'}`} key={type}>
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{getTicketTypeLabel(type)}</p>
                  <p className="text-sm font-bold text-cyan-700">{formatCurrency(price)}</p>
                  <p className="text-xs font-semibold text-slate-500">{availability.available} available</p>
                </div>
                <div className="flex items-center gap-3">
                  <button aria-label={`Decrease ${type} quantity`} className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 text-cyan-700 disabled:opacity-30" disabled={quantity <= 0 || availability.disabled} type="button" onClick={() => changeQuantity(type, -1)}><span className="material-symbols-outlined text-lg">remove</span></button>
                  <span className="w-5 text-center font-black text-slate-950">{quantity}</span>
                  <button aria-label={`Increase ${type} quantity`} className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-700 text-white disabled:opacity-30" disabled={availability.disabled || quantity >= availability.maximum} type="button" onClick={() => changeQuantity(type, 1)}><span className="material-symbols-outlined text-lg">add</span></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between border-t border-cyan-100 pt-5">
        <div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Selected total</p><p className="text-2xl font-black text-cyan-700">{formatCurrency(total)}</p></div>
        <button className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-700 px-7 py-3 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40" disabled={!schedule || selectedLines.length === 0 || isLoading} type="button" onClick={handleAdd}>Add to Cart</button>
      </div>
      {notice && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-center text-sm font-black text-emerald-700" role="status">{notice}</p>}
    </section>
  );
}
