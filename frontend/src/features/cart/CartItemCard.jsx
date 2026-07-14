import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { formatCurrency, getTicketTypeLabel } from '../../shared/utils/ticketPricing.js';
import { getShowDetail } from '../../services/showService.js';

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
  const [isEditing, setIsEditing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDetailData, setShowDetailData] = useState(null);

  useEffect(() => {
    if (showDetailModal && !showDetailData) {
      getShowDetail(line.showId).then(setShowDetailData).catch(console.error);
    }
  }, [showDetailModal, line.showId, showDetailData]);
  const maximum = Math.min(10, Math.max(1, Number(line.availableTickets) || 1));
  const needsReview = line.requiresReview && !reviewed;
  
  const ages = line.ages || { adult: line.quantity, child: 0, senior: 0 };
  const totalQuantity = (ages.adult || 0) + (ages.child || 0) + (ages.senior || 0);

  const handleAgeQuantity = (type, delta) => {
    const currentAges = { ...ages };
    currentAges[type] = Math.max(0, (currentAges[type] || 0) + delta);
    const newTotal = (currentAges.adult || 0) + (currentAges.child || 0) + (currentAges.senior || 0);
    if (newTotal < 1 || newTotal > maximum) return;
    onQuantity(line.key, newTotal, maximum, currentAges);
  };

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
          <div className="mt-4">
            {isEditing ? (
              <div className="max-w-xs space-y-3 rounded-2xl border border-cyan-100 bg-slate-50 p-4">
                {['adult', 'child', 'senior'].map((ageType) => (
                  <div key={ageType} className="flex items-center justify-between">
                    <span className="font-bold capitalize text-slate-700">{ageType}</span>
                    <div className="flex items-center gap-2 rounded-full border border-cyan-100 bg-white p-1">
                      <button aria-label={`Decrease ${ageType}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-cyan-700 disabled:opacity-30" disabled={!line.checkoutAvailable || ages[ageType] === 0 || totalQuantity <= 1} type="button" onClick={() => handleAgeQuantity(ageType, -1)}><span className="material-symbols-outlined text-lg">remove</span></button>
                      <span className="min-w-6 text-center font-black text-slate-950">{ages[ageType] || 0}</span>
                      <button aria-label={`Increase ${ageType}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-700 text-white disabled:opacity-30" disabled={!line.checkoutAvailable || totalQuantity >= maximum} type="button" onClick={() => handleAgeQuantity(ageType, 1)}><span className="material-symbols-outlined text-lg">add</span></button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-right">
                  <button type="button" className="text-sm font-black text-cyan-700 hover:text-cyan-800" onClick={() => setIsEditing(false)}>Done</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center w-full">
                <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-700">
                  {ages.adult > 0 && <span className="rounded-full bg-cyan-50 px-3 py-1">Adult x{ages.adult}</span>}
                  {ages.child > 0 && <span className="rounded-full bg-cyan-50 px-3 py-1">Child x{ages.child}</span>}
                  {ages.senior > 0 && <span className="rounded-full bg-cyan-50 px-3 py-1">Senior x{ages.senior}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right flex flex-col justify-between items-start sm:items-end">
          <div>
            <p className="text-sm font-bold text-slate-500">{formatCurrency(line.unitPrice)} each</p>
            <p className="mt-1 text-2xl font-black text-cyan-700">{formatCurrency(Number(line.unitPrice) * Number(line.quantity))}</p>
          </div>
          {!isEditing && (
            <button type="button" className="text-sm font-bold text-cyan-700 hover:text-cyan-800 underline mt-4" onClick={() => setIsEditing(true)}>Edit</button>
          )}
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
        <button className="flex items-center gap-1 text-sm font-black text-cyan-700 hover:text-cyan-800" type="button" onClick={() => setShowDetailModal(true)}>View detail<span className="material-symbols-outlined text-lg">chevron_right</span></button>
      </div>

      {showDetailModal && (
        <div aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog">
          <button aria-label="Close" className="absolute inset-0 bg-slate-950/45 cursor-default" onClick={() => setShowDetailModal(false)} type="button" />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sm:px-8">
              <h2 className="text-xl font-black text-slate-950">Show Details</h2>
              <button aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition text-slate-500" onClick={() => setShowDetailModal(false)} type="button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto max-h-[80vh]">
              {showDetailData ? (
                <div className="rounded-2xl p-2 sm:p-4">
                  <h2 className="mb-6 text-2xl font-extrabold text-cyan-800">About the Show</h2>
                  <p className="text-base font-medium leading-relaxed text-slate-600">{showDetailData.description || 'More information about this show will be available soon.'}</p>
                  <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
                    <div><span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Category</span><span className="text-sm font-bold text-cyan-700">Interactive Arts</span></div>
                    <div><span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Show Type</span><span className="text-sm font-bold text-cyan-700">4D Experience</span></div>
                    <div><span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Audience</span><span className="text-sm font-bold text-cyan-700">All Ages</span></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-10">
                  <div aria-hidden="true" className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-700" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
