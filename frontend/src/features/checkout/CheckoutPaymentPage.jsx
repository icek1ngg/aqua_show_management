import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getCheckoutDraft, clearCheckoutDraft, saveCheckoutDraft } from './checkoutDraft.js';
import { startCheckoutPayment } from '../../services/checkoutService.js';
import { getSchedule } from '../../services/showService.js';
import { useCart } from '../cart/CartContext.jsx';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import { normalizeTicketType } from '../../shared/utils/ticketPricing.js';

function requestId() {
  return globalThis.crypto?.randomUUID?.() || `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const priceFields = { STANDARD: 'standardPrice', VIP: 'vipPrice', FAMILY: 'familyPrice' };
const availabilityFields = { STANDARD: 'standardAvailableTickets', VIP: 'vipAvailableTickets', FAMILY: 'familyAvailableTickets' };

export default function CheckoutPaymentPage() {
  const [draft, setDraft] = useState(getCheckoutDraft());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lines, setLines] = useState([]);
  const [requiresReview, setRequiresReview] = useState(false);
  const { removeItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!draft) return;
    let active = true;

    const fetchSchedules = async () => {
      setLoading(true);
      setError('');
      try {
        const scheduleIds = [...new Set(draft.items.map(i => String(i.scheduleId)))];
        const results = await Promise.allSettled(scheduleIds.map(async id => [id, await getSchedule(id)]));
        if (!active) return;

        const scheduleById = new Map();
        results.forEach(res => {
          if (res.status === 'fulfilled') scheduleById.set(res.value[0], res.value[1]);
        });

        let needsReview = false;
        const nextLines = draft.items.map(item => {
          const sched = scheduleById.get(String(item.scheduleId));
          const tType = normalizeTicketType(item.ticketType);

          if (!sched || sched.status !== 'ACTIVE') {
            needsReview = true;
            return { ...item, invalid: true, reason: 'Schedule is no longer available.' };
          }

          const start = sched.startTime ? new Date(sched.startTime) : null;
          if (start && !Number.isNaN(start.getTime()) && start.getTime() <= Date.now() + 30 * 60 * 1000) {
            needsReview = true;
            return { ...item, invalid: true, reason: 'Booking is closed for this schedule.' };
          }

          const unitPrice = Number(sched[priceFields[tType]]) || 0;
          const available = Math.max(0, Math.trunc(Number(sched[availabilityFields[tType]]) || 0));

          const priceChanged = unitPrice !== item.expectedUnitPrice;
          const noStock = available < item.quantity;

          if (priceChanged || noStock) {
            needsReview = true;
          }

          return {
            ...item,
            currentUnitPrice: unitPrice,
            currentAvailable: available,
            priceChanged,
            noStock,
            invalid: false
          };
        });

        setLines(nextLines);
        setRequiresReview(needsReview);
      } catch (err) {
        if (active) setError('Failed to refresh latest schedule information.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSchedules();
    return () => { active = false; };
  }, [draft]);

  const handleConfirmChanges = () => {
    // Filter out invalid items, adjust quantities, update prices
    const validLines = lines.filter(l => !l.invalid && !l.noStock); // If no stock, remove. Wait, if partial stock, we should adjust.
    // For simplicity, if noStock, we just remove it or adjust quantity. Let's adjust quantity if available > 0, else remove.
    const updatedItems = lines.filter(l => !l.invalid && l.currentAvailable > 0).map(l => ({
      ...l,
      quantity: Math.min(l.quantity, l.currentAvailable),
      expectedUnitPrice: l.currentUnitPrice
    }));

    if (updatedItems.length === 0) {
      clearCheckoutDraft();
      navigate('/bookings/create');
      return;
    }

    const newDraft = {
      ...draft,
      idempotencyKey: requestId(),
      items: updatedItems.map(({ currentUnitPrice, currentAvailable, priceChanged, noStock, invalid, ...rest }) => rest)
    };
    saveCheckoutDraft(newDraft);
    setDraft(newDraft);
    setRequiresReview(false);
  };

  const handlePay = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    const payload = {
      idempotencyKey: draft.idempotencyKey,
      items: draft.items.map(item => ({
        scheduleId: item.scheduleId,
        ticketType: item.ticketType,
        quantity: item.quantity,
        expectedUnitPrice: item.expectedUnitPrice
      }))
    };

    try {
      const response = await startCheckoutPayment(payload);
      if (!response?.bookingId || !response?.payment) throw new Error('Payment session was not returned.');
      removeItems(draft.cartKeys);
      clearCheckoutDraft();
      navigate(`/bookings/${response.bookingId}/payment`, { replace: true, state: { paymentSession: response.payment } });
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate('/login', { state: { from: location } });
        return;
      }
      if (err?.response?.status === 409) {
        setError('Ticket availability or prices have changed. Please review your cart.');
        setRequiresReview(true);
        // Force refresh by re-setting draft
        setDraft({ ...draft });
      } else {
        const errors = err?.response?.data?.errors;
        const msg = errors ? Object.values(errors).filter(Boolean).join(' ') : (err?.response?.data?.message || 'Payment initiation failed.');
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft) {
    return <Navigate to="/bookings/create" replace />;
  }

  const totals = lines.reduce((acc, line) => {
    if (line.invalid) return acc;
    const q = line.noStock ? Math.min(line.quantity, line.currentAvailable) : line.quantity;
    acc.tickets += q;
    acc.amount += q * (line.currentUnitPrice ?? line.expectedUnitPrice);
    return acc;
  }, { tickets: 0, amount: 0 });

  return (
    <MainLayout>
      <main className="min-h-[70vh] bg-gradient-to-br from-cyan-50 via-white to-orange-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <section className="mx-auto mb-10 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 opacity-45"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-400 font-black text-white">01</span><span className="font-black text-slate-900">Cart</span></div>
              <div className="h-px flex-1 border-t border-dashed border-cyan-300" />
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 font-black text-white">02</span><span className="font-black text-slate-900">Checkout</span></div>
            </div>
          </section>

          <h1 className="mb-6 text-3xl font-black text-slate-950">Review & Pay</h1>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            {loading ? (
              <div className="text-center font-bold text-cyan-700 py-10">Refreshing schedule...</div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {lines.map((line, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${line.invalid || line.priceChanged || line.noStock ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900">{line.displaySnapshot?.showTitle}</h3>
                          <p className="text-sm text-slate-500">{line.displaySnapshot?.venueName} &bull; {new Date(line.displaySnapshot?.startTime).toLocaleString()}</p>
                          <p className="text-sm font-semibold mt-1">
                            {line.ticketType} &times; {line.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">
                            {(line.currentUnitPrice ?? line.expectedUnitPrice).toLocaleString()} VND
                          </p>
                        </div>
                      </div>
                      {(line.invalid || line.priceChanged || line.noStock) && (
                        <div className="mt-3 text-sm font-bold text-amber-700">
                          {line.invalid && line.reason}
                          {!line.invalid && line.priceChanged && `Price changed from ${line.expectedUnitPrice.toLocaleString()} VND.`}
                          {!line.invalid && line.noStock && `Only ${line.currentAvailable} tickets left.`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center mb-6">
                  <span className="font-bold text-slate-500">Total ({totals.tickets} tickets)</span>
                  <span className="text-2xl font-black text-cyan-700">{totals.amount.toLocaleString()} VND</span>
                </div>

                {requiresReview ? (
                  <button
                    onClick={handleConfirmChanges}
                    className="w-full rounded-xl bg-amber-500 py-4 font-black text-white transition hover:bg-amber-600"
                  >
                    Confirm Changes
                  </button>
                ) : (
                  <button
                    onClick={handlePay}
                    disabled={submitting}
                    className="w-full rounded-xl bg-cyan-600 py-4 font-black text-white transition hover:bg-cyan-700 disabled:opacity-50"
                  >
                    {submitting ? 'Initiating Payment...' : 'Proceed to Payment'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </MainLayout>
  );
}
