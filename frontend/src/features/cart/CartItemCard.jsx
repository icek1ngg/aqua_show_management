import { Link } from 'react-router-dom';

import { formatCurrency, getTicketTypeLabel } from '../../shared/utils/ticketPricing.js';

function formatSchedule(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime())) return 'Schedule time unavailable';
  const date = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const startLabel = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const endLabel = Number.isNaN(end.getTime()) ? '' : ` - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  return `${date} · ${startLabel}${endLabel}`;
}

export default function CartItemCard({ line, checked, reviewed, onToggle, onQuantity, onRemove, onAcceptReview }) {
  const maximum = Math.min(10, Math.max(1, Number(line.availableTickets) || 1));
  const needsReview = line.requiresReview && !reviewed;
  return (
    <article className={`overflow-hidden rounded-[2rem] border bg-white shadow-sm ${line.checkoutAvailable ? 'border-cyan-100' : 'border-red-100'}`}>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        <input aria-label={`Select ${line.showTitle}`} checked={checked} className="mt-1 h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" disabled={!line.checkoutAvailable || needsReview} type="checkbox" onChange={() => onToggle(line.key)} />
        <div className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-cyan-50 sm:w-32">
          {line.imageUrl ? <img alt={line.showTitle} className="h-full w-full object-cover" src={line.imageUrl} /> : <span className="material-symbols-outlined flex h-full items-center justify-center text-5xl text-cyan-300">water</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">{getTicketTypeLabel(line.ticketType)}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{line.showTitle || 'AquaPulse Show'}</h2>
          <div className="mt-3 space-y-1 text-sm font-semibold text-slate-600">
            <p className="flex gap-2"><span className="material-symbols-outlined text-lg text-cyan-700">calendar_month</span>{formatSchedule(line.startTime, line.endTime)}</p>
            <p className="flex gap-2"><span className="material-symbols-outlined text-lg text-cyan-700">location_on</span>{line.venueName || 'Venue unavailable'}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 p-1">
              <button aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-cyan-700 disabled:opacity-30" disabled={!line.checkoutAvailable || line.quantity <= 1} type="button" onClick={() => onQuantity(line.key, line.quantity - 1, maximum)}><span className="material-symbols-outlined text-lg">remove</span></button>
              <span className="min-w-6 text-center font-black text-slate-950">{line.quantity}</span>
              <button aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-700 text-white disabled:opacity-30" disabled={!line.checkoutAvailable || line.quantity >= maximum} type="button" onClick={() => onQuantity(line.key, line.quantity + 1, maximum)}><span className="material-symbols-outlined text-lg">add</span></button>
            </div>
            <p className="text-sm font-bold text-slate-500">{line.availableTickets ?? 0} available</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-slate-500">{formatCurrency(line.unitPrice)} each</p>
          <p className="mt-1 text-2xl font-black text-cyan-700">{formatCurrency(Number(line.unitPrice) * Number(line.quantity))}</p>
        </div>
      </div>

      {(line.unavailableReason || needsReview) && (
        <div className={`mx-5 mb-4 rounded-2xl p-4 text-sm font-bold sm:mx-6 ${line.unavailableReason ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
          {line.unavailableReason || 'Price or availability changed. Review the updated details before selecting this ticket.'}
          {needsReview && <button className="ml-2 underline" type="button" onClick={() => onAcceptReview(line)}>Accept update</button>}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
        <button className="flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-red-600" type="button" onClick={() => onRemove(line.key)}><span className="material-symbols-outlined text-lg">delete</span>Delete ticket</button>
        <Link className="flex items-center gap-1 text-sm font-black text-cyan-700" to={`/shows/${line.showId}`}>View detail<span className="material-symbols-outlined text-lg">chevron_right</span></Link>
      </div>
    </article>
  );
}
