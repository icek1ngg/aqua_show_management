import { formatCurrency } from '../../shared/utils/ticketPricing.js';

export default function CartOrderSummary({ totals, hasPendingReview, isLoading, isSubmitting, authenticated, error, onContinue }) {
  const disabled = isLoading || isSubmitting || totals.lines === 0 || hasPendingReview;
  return (
    <aside className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/50 lg:sticky lg:top-24">
      <h2 className="text-2xl font-black text-slate-950">Order details</h2>
      <div className="my-7 rounded-2xl bg-cyan-50 p-5 text-center">
        <span className="material-symbols-outlined text-5xl text-cyan-600">shopping_cart_checkout</span>
        <p className="mt-2 text-sm font-bold text-slate-600">{totals.lines} selected {totals.lines === 1 ? 'line' : 'lines'} · {totals.tickets} {totals.tickets === 1 ? 'ticket' : 'tickets'}</p>
      </div>
      <div className="space-y-4 border-t border-slate-100 pt-6">
        <div className="flex justify-between text-sm"><span className="font-semibold text-slate-500">Subtotal</span><span className="font-black text-slate-900">{formatCurrency(totals.amount)}</span></div>
        <div className="flex justify-between text-sm"><span className="font-semibold text-slate-500">Discount</span><span className="font-black text-slate-900">{formatCurrency(0)}</span></div>
        <div className="flex justify-between border-t border-slate-100 pt-4 text-lg"><span className="font-black text-slate-700">Total amount</span><span className="text-2xl font-black text-orange-600">{formatCurrency(totals.amount)}</span></div>
      </div>
      {hasPendingReview && <p className="mt-5 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">Accept all updated prices and availability before checkout.</p>}
      {error && <p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" disabled={disabled} type="button" onClick={onContinue}>
        {isSubmitting ? 'Creating Booking...' : authenticated ? 'Continue to Payment' : 'Sign In to Continue'}
        {!isSubmitting && <span className="material-symbols-outlined">arrow_forward</span>}
      </button>
    </aside>
  );
}
