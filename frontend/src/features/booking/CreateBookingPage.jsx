import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from '../cart/CartContext.jsx';
import CartItemCard from '../cart/CartItemCard.jsx';
import CartOrderSummary from '../cart/CartOrderSummary.jsx';
import {
  buildCheckoutPayload,
  reviewCartLine,
  selectedCartTotals,
} from '../cart/cartCheckout.js';
import { cartItemKey } from '../cart/cartStorage.js';
import { createBooking } from '../../services/bookingService.js';
import { getSchedule } from '../../services/showService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import { saveCheckoutDraft } from '../checkout/checkoutDraft.js';

function bookingErrorMessage(error) {
  if (error?.response?.status === 409) return 'Ticket availability changed. We refreshed the cart with the latest information.';
  if (error?.response?.status === 503) return 'Booking service is temporarily unavailable. Please try again.';
  const errors = error?.response?.data?.errors;
  if (errors) return Object.values(errors).filter(Boolean).join(' ');
  return error?.response?.data?.message || error?.message || 'Could not create the booking.';
}

function requestId() {
  return globalThis.crypto?.randomUUID?.() || `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CreateBookingPage() {
  const { items, updateQuantity, removeItem, removeItems } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initializedSelection = useRef(false);
  const [lines, setLines] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [reviewedKeys, setReviewedKeys] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (items.length === 0) {
      setLines([]);
      setSelectedKeys(new Set());
      setIsLoading(false);
      initializedSelection.current = false;
      return undefined;
    }

    setIsLoading(true);
    setError('');
    const scheduleIds = [...new Set(items.map((item) => String(item.scheduleId)))];
    Promise.allSettled(scheduleIds.map(async (scheduleId) => [scheduleId, await getSchedule(scheduleId)]))
      .then((results) => {
        if (!active) return;
        const scheduleById = new Map();
        results.forEach((result) => {
          if (result.status === 'fulfilled') scheduleById.set(result.value[0], result.value[1]);
        });
        const nextLines = items.map((item) => reviewCartLine(item, scheduleById.get(String(item.scheduleId))));
        const availableKeys = new Set(nextLines.filter((line) => line.checkoutAvailable).map((line) => line.key));
        setLines(nextLines);
        setSelectedKeys((current) => {
          if (!initializedSelection.current) {
            initializedSelection.current = true;
            return new Set(nextLines.filter((line) => line.checkoutAvailable && !line.requiresReview).map((line) => line.key));
          }
          return new Set([...current].filter((key) => availableKeys.has(key)));
        });
        setReviewedKeys((current) => new Set([...current].filter((key) => availableKeys.has(key))));
      })
      .catch(() => active && setError('Could not refresh the cart. Please try again.'))
      .finally(() => active && setIsLoading(false));

    return () => { active = false; };
  }, [items, refreshKey]);

  const totals = useMemo(() => selectedCartTotals(lines, selectedKeys), [lines, selectedKeys]);
  const hasPendingReview = lines.some((line) => selectedKeys.has(line.key) && line.requiresReview && !reviewedKeys.has(line.key));

  const toggleLine = (key) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setError('');
  };

  const removeLine = (key) => {
    removeItem(key);
    setSelectedKeys((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  const acceptReview = (line) => {
    setReviewedKeys((current) => new Set(current).add(line.key));
    setSelectedKeys((current) => new Set(current).add(line.key));
    updateQuantity(line.key, line.quantity, Math.min(10, line.availableTickets));
  };

  const handleContinue = async () => {
    if (authLoading || isSubmitting) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    const selectedLines = lines.filter((line) => selectedKeys.has(line.key) && line.checkoutAvailable);
    const unreviewed = selectedLines.some((line) => line.requiresReview && !reviewedKeys.has(line.key));
    if (selectedLines.length === 0 || unreviewed) {
      setError(unreviewed ? 'Review updated cart items before continuing.' : 'Select at least one available ticket.');
      return;
    }

    const checkedOutKeys = Array.from(new Set(selectedLines.map((line) => line.key || cartItemKey(line))));
    
    const draft = {
      idempotencyKey: requestId(),
      cartKeys: checkedOutKeys,
      items: selectedLines.flatMap(line => Object.entries(line.ages || { adult: line.quantity })
        .filter(([, quantity]) => Number(quantity) > 0)
        .map(([passengerType, quantity]) => ({
          scheduleId: String(line.scheduleId),
          ticketType: line.ticketType,
          passengerType: passengerType.toUpperCase(),
          quantity: Math.trunc(Number(quantity)),
          expectedUnitPrice: Number(line.unitPrice),
          displaySnapshot: {
            showTitle: line.showTitle,
            imageUrl: line.imageUrl,
            venueName: line.venueName,
            startTime: line.startTime,
            endTime: line.endTime
          }
        })))
    };
    
    saveCheckoutDraft(draft);
    navigate('/checkout/payment');
  };

  return (
    <MainLayout>
      <main className="min-h-[70vh] bg-gradient-to-br from-cyan-50 via-white to-orange-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="mx-auto mb-10 max-w-3xl rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 font-black text-white">01</span><span className="font-black text-slate-900">Cart</span></div>
              <div className="h-px flex-1 border-t border-dashed border-cyan-300" />
              <div className="flex items-center gap-3 opacity-45"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-400 font-black text-white">02</span><span className="font-black text-slate-900">Payment</span></div>
            </div>
          </section>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">AquaPulse Checkout</p><h1 className="mt-2 text-4xl font-black text-slate-950">Your Ticket Cart</h1><p className="mt-2 font-semibold text-slate-500">Choose which tickets to include in this payment.</p></div>
            <Link className="rounded-full border-2 border-cyan-700 px-6 py-3 font-black text-cyan-700 transition hover:bg-cyan-50" to="/#shows">Add More Tickets</Link>
          </div>

          {items.length === 0 ? (
            <section className="rounded-[2rem] border border-cyan-100 bg-white p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-7xl text-cyan-300">shopping_cart</span>
              <h2 className="mt-4 text-2xl font-black text-slate-950">Your cart is empty</h2>
              <p className="mt-2 font-semibold text-slate-500">Select tickets from an upcoming AquaPulse show.</p>
              <Link className="mt-7 inline-flex rounded-full bg-cyan-700 px-8 py-4 font-black text-white" to="/#shows">Browse Shows</Link>
            </section>
          ) : (
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className="space-y-5">
                {isLoading ? <div className="rounded-[2rem] bg-white p-10 text-center font-black text-cyan-700">Refreshing prices and availability...</div> : lines.map((line) => (
                  <CartItemCard
                    checked={selectedKeys.has(line.key)}
                    key={line.key}
                    line={line}
                    reviewed={reviewedKeys.has(line.key)}
                    onAcceptReview={acceptReview}
                    onQuantity={updateQuantity}
                    onRemove={removeLine}
                    onToggle={toggleLine}
                  />
                ))}
              </section>
              <CartOrderSummary
                authenticated={isAuthenticated}
                error={error}
                hasPendingReview={hasPendingReview}
                isLoading={isLoading || authLoading}
                isSubmitting={isSubmitting}
                totals={totals}
                onContinue={handleContinue}
              />
            </div>
          )}
        </div>
      </main>
    </MainLayout>
  );
}
