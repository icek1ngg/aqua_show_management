import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import { createPayment, reconcilePayment } from '../../services/paymentService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import { isTerminalBookingStatus, normalizeBookingPaymentStatus } from '../../shared/utils/paymentStatus.js';
import { formatCurrency, getTicketTypeLabel } from '../../shared/utils/ticketPricing.js';

const fallbackImageUrl =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80';

const statusCopy = {
  PROCESSING: {
    label: 'Processing',
    tone: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    title: 'Booking is still being processed',
    message: 'AquaPulse is finalizing this booking before payment can start.',
  },
  PENDING_PAYMENT: {
    label: 'Pending payment',
    tone: 'border-yellow-200 bg-yellow-100 text-[#a43c12]',
    title: 'Complete payment before the hold expires',
    message: 'Your tickets are temporarily held while PayOS payment is pending.',
  },
  PAID: {
    label: 'Paid',
    tone: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    title: 'Payment completed',
    message: 'The booking is paid. Tickets and email status are available on the payment result page.',
  },
  EXPIRED: {
    label: 'Expired',
    tone: 'border-slate-200 bg-slate-100 text-slate-600',
    title: 'Booking hold expired',
    message: 'This booking can no longer be paid. Please create a new booking.',
  },
  FAILED: {
    label: 'Failed',
    tone: 'border-red-200 bg-red-100 text-red-700',
    title: 'Payment failed',
    message: 'This booking could not be completed. Please create a new booking.',
  },
};

function normalizeBooking(booking) {
  if (!booking) {
    return null;
  }

  return {
    id: booking.id,
    bookingCode: booking.bookingCode || booking.id,
    showName: booking.showName || 'AquaPulse Show',
    showDate: booking.showDate,
    ticketType: getTicketTypeLabel(booking.ticketType),
    quantity: booking.quantity ?? 0,
    unitPrice: booking.unitPrice,
    totalAmount: booking.totalAmount,
    status: booking.status || 'PROCESSING',
    createdAt: booking.createdAt,
    expiresAt: booking.expiresAt,
    payment: booking.payment || null,
    tickets: booking.tickets || null,
    emailNotification: booking.emailNotification || null,
  };
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatCountdown(seconds) {
  if (seconds === null) {
    return '--:--';
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}

function getInitialSeconds(expiresAt) {
  if (!expiresAt) {
    return null;
  }

  const expiresAtTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtTime)) {
    return null;
  }

  return Math.max(0, Math.floor((expiresAtTime - Date.now()) / 1000));
}

function getLoadErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 400) {
    return 'This booking cannot be paid in its current state.';
  }

  if (status === 404) {
    return 'This booking was not found or you do not have permission to view it.';
  }

  if (status === 503) {
    return 'Payment service is temporarily unavailable. Please try again later.';
  }

  return error?.response?.data?.message || error?.message || 'Unable to load booking.';
}

function getPaymentErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 400) {
    return error?.response?.data?.message || 'This booking is not eligible for payment.';
  }

  if (status === 404) {
    return 'This booking was not found or it no longer belongs to your account.';
  }

  if (status === 503) {
    return 'PayOS is not available right now. Please try again later.';
  }

  return error?.response?.data?.message || error?.message || 'Unable to start payment.';
}

function paymentQrImageUrl(paymentSession, amount) {
  if (paymentSession?.qrCode) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(paymentSession.qrCode)}`;
  }

  if (paymentSession?.bankBin && paymentSession?.accountNumber) {
    const qrAmount = Number(paymentSession.amount || amount || 0);
    const description = paymentSession.description || paymentSession.payosOrderCode || '';
    const accountName = paymentSession.accountName || 'ASMS';
    return `https://img.vietqr.io/image/${paymentSession.bankBin}-${paymentSession.accountNumber}-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
  }

  return null;
}

function DetailTile({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-cyan-50 p-4">
      <span className="material-symbols-outlined text-cyan-700" aria-hidden="true">
        {icon}
      </span>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 break-words font-black text-slate-900">{value || 'Not available'}</p>
    </div>
  );
}

function PaymentInfoRow({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="break-all text-right font-black text-slate-900">{value}</span>
    </div>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileMessage, setReconcileMessage] = useState('');
  const [error, setError] = useState('');
  const hasRedirectedToResultRef = useRef(false);

  async function refreshBooking({ showLoading = false } = {}) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const detail = await getBookingDetail(bookingId);
      const normalized = normalizeBooking(detail);
      setBooking(normalized);
      setCountdownSeconds(getInitialSeconds(normalized?.expiresAt));
      setError('');
      return normalized;
    } catch (loadError) {
      if (loadError?.response?.status === 401) {
        navigate('/login', { replace: true, state: { from: location } });
        return null;
      }

      setError(getLoadErrorMessage(loadError));
      return null;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      const detail = await refreshBooking({ showLoading: false });
      if (!ignore) {
        setBooking(detail);
        setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [bookingId, location, navigate]);

  useEffect(() => {
    const statusState = normalizeBookingPaymentStatus(booking, booking?.payment);
    if (countdownSeconds === null || countdownSeconds <= 0 || statusState.status !== 'PENDING_PAYMENT') {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setCountdownSeconds((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [booking, countdownSeconds]);

  useEffect(() => {
    const statusState = normalizeBookingPaymentStatus(booking, booking?.payment);
    if (!paymentSession || isTerminalBookingStatus(statusState.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      const latest = await refreshBooking();
      const latestStatus = normalizeBookingPaymentStatus(latest, latest?.payment);
      if (isTerminalBookingStatus(latestStatus.status)) {
        window.clearInterval(intervalId);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [booking, bookingId, paymentSession]);

  useEffect(() => {
    const statusState = normalizeBookingPaymentStatus(booking, booking?.payment);
    if (statusState.status !== 'PAID' || statusState.bookingStatus === 'PAID') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      refreshBooking();
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [booking]);

  useEffect(() => {
    const statusState = normalizeBookingPaymentStatus(booking, booking?.payment);
    if (statusState.status !== 'PAID' || hasRedirectedToResultRef.current) {
      return undefined;
    }

    hasRedirectedToResultRef.current = true;
    setReconcileMessage('Payment confirmed. Opening the secure result page...');
    const timeoutId = window.setTimeout(() => {
      navigate(`/payments/result?bookingId=${bookingId}`, { replace: true });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [booking, bookingId, navigate]);

  const normalizedStatus = normalizeBookingPaymentStatus(booking, booking?.payment);
  const effectiveStatus = normalizedStatus.status === 'PENDING_PAYMENT' && countdownSeconds === 0 ? 'EXPIRED' : normalizedStatus.status;
  const isPaid = effectiveStatus === 'PAID';
  const isExpiredOrFailed = ['EXPIRED', 'FAILED'].includes(effectiveStatus);
  const canPay = effectiveStatus === 'PENDING_PAYMENT';
  const statusMeta = statusCopy[effectiveStatus] || statusCopy.PROCESSING;
  const paymentStatus = isPaid ? 'SUCCESS' : normalizedStatus.paymentStatus || paymentSession?.status || (effectiveStatus === 'FAILED' ? 'FAILED' : effectiveStatus === 'EXPIRED' ? 'EXPIRED' : 'PENDING');
  const paymentDetails = paymentSession || booking?.payment;
  const checkoutUrl = paymentSession?.checkoutUrl || paymentSession?.paymentUrl;
  const qrUrl = paymentQrImageUrl(paymentSession, booking?.totalAmount);

  const paymentSteps = useMemo(
    () => [
      { label: 'Booking held', icon: 'task_alt', active: Boolean(booking), value: effectiveStatus || 'Loading' },
      { label: 'PayOS checkout', icon: 'payments', active: Boolean(paymentSession) || isPaid, value: paymentStatus },
      { label: 'Tickets', icon: 'qr_code_2', active: isPaid, value: isPaid ? 'Queued / ready' : 'After payment' },
      { label: 'Email', icon: 'outgoing_mail', active: isPaid, value: isPaid ? 'Queued / sent' : 'After payment' },
    ],
    [booking, isPaid, paymentSession, paymentStatus],
  );

  const handlePay = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payment = await createPayment(bookingId);
      setPaymentSession(payment);
      setReconcileMessage('');
    } catch (payError) {
      if (payError?.response?.status === 401) {
        navigate('/login', { replace: true, state: { from: location } });
        return;
      }

      setError(getPaymentErrorMessage(payError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReconcile = async () => {
    setReconciling(true);
    setError('');
    setReconcileMessage('');

    try {
      const reconciliation = await reconcilePayment(bookingId);
      setPaymentSession((current) => ({
        ...current,
        paymentId: reconciliation.paymentId,
        payosOrderCode: reconciliation.orderCode,
        status: reconciliation.paymentStatus,
        paidAt: reconciliation.paidAt,
      }));
      setBooking((current) => current ? {
        ...current,
        status: reconciliation.bookingStatus,
        payment: {
          ...current.payment,
          id: reconciliation.paymentId,
          payosOrderCode: reconciliation.orderCode,
          amount: current.payment?.amount ?? current.totalAmount,
          status: reconciliation.paymentStatus,
          paidAt: reconciliation.paidAt,
        },
      } : current);
      setReconcileMessage(reconciliation.message);
      await refreshBooking();
    } catch (reconcileError) {
      if (reconcileError?.response?.status === 401) {
        navigate('/login', { replace: true, state: { from: location } });
        return;
      }
      setError(reconcileError.response?.data?.message || 'Unable to check payment status right now.');
    } finally {
      setReconciling(false);
    }
  };

  return (
    <MainLayout>
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="inline-flex rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-800">
                Payment
              </p>
              <h1 className="mt-4 text-4xl font-black text-slate-950 md:text-5xl">Complete payment</h1>
              <p className="mt-3 max-w-2xl text-slate-600">PayOS checkout for your reserved AquaPulse booking.</p>
            </div>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-bold text-cyan-700 hover:bg-cyan-50"
              to={`/bookings/${bookingId}`}
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              Booking detail
            </Link>
          </div>

          {loading ? (
            <section className="rounded-[1.5rem] border border-cyan-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
              <p className="font-bold text-slate-600">Loading booking...</p>
            </section>
          ) : !booking && error ? (
            <section className="rounded-[1.5rem] border border-red-100 bg-white p-10 text-center shadow-sm" role="alert">
              <span className="material-symbols-outlined text-5xl text-red-500">error</span>
              <h2 className="mt-4 text-3xl font-black text-slate-950">Booking unavailable</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{error}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link className="rounded-full bg-cyan-700 px-6 py-3 font-bold text-white transition hover:bg-cyan-800" to="/bookings/my">
                  My bookings
                </Link>
                <Link className="rounded-full border border-cyan-200 bg-white px-6 py-3 font-bold text-cyan-700 transition hover:bg-cyan-50" to="/">
                  Back Home
                </Link>
              </div>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <section className="space-y-6 lg:col-span-8">
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700" role="alert">
                    {error}
                  </div>
                ) : null}
                {reconcileMessage ? (
                  <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'}`}>
                    {reconcileMessage}
                  </div>
                ) : null}

                {booking ? (
                  <>
                    <article className="overflow-hidden rounded-[1.5rem] border border-cyan-100 bg-white shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
                      <div className="relative h-72 overflow-hidden">
                        <img alt={booking.showName} className="h-full w-full object-cover" src={fallbackImageUrl} />
                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/80 via-cyan-950/20 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100">Booking #{booking.bookingCode}</p>
                          <h2 className="mt-2 text-3xl font-black">{booking.showName}</h2>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                        <DetailTile icon="event" label="Show date" value={formatDate(booking.showDate)} />
                        <DetailTile icon="confirmation_number" label="Tickets" value={`${booking.quantity} ${booking.ticketType}`} />
                        <DetailTile icon="payments" label="Total" value={formatCurrency(booking.totalAmount)} />
                      </div>
                    </article>

                    <article className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <span className={`inline-flex rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${statusMeta.tone}`}>
                            {statusMeta.label}
                          </span>
                          <h3 className="mt-4 text-2xl font-black text-slate-950">{statusMeta.title}</h3>
                          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{statusMeta.message}</p>
                        </div>
                        <div className={`text-right font-black ${isPaid ? 'text-emerald-700' : isExpiredOrFailed ? 'text-red-600' : 'text-cyan-700'}`}>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hold timer</p>
                          <p className={isPaid ? 'mt-2 text-4xl' : 'mt-2 text-5xl tracking-widest'}>
                            {isPaid ? 'PAID' : formatCountdown(countdownSeconds)}
                          </p>
                        </div>
                      </div>
                    </article>

                    <article className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">Payment flow</h3>
                      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        {paymentSteps.map((step) => (
                          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4" key={step.label}>
                            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${step.active ? 'bg-cyan-700 text-white' : 'bg-white text-slate-400'}`}>
                              <span className="material-symbols-outlined">{step.icon}</span>
                            </span>
                            <p className="mt-3 text-sm font-black text-slate-800">{step.label}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{step.value}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  </>
                ) : null}
              </section>

              <aside className="lg:sticky lg:top-28 lg:col-span-4">
                <div className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Checkout</p>
                  <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                    <PaymentInfoRow label="Booking code" value={booking?.bookingCode} />
                    <PaymentInfoRow label="Show date" value={formatDate(booking?.showDate)} />
                    <PaymentInfoRow label="Quantity" value={booking ? String(booking.quantity) : ''} />
                    <PaymentInfoRow label="Unit price" value={formatCurrency(booking?.unitPrice)} />
                  </div>
                  <div className="mt-6 border-t-2 border-dashed border-cyan-100 pt-6">
                    <div className="flex items-end justify-between gap-4">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Total amount</span>
                      <span className="text-3xl font-black text-cyan-700">{formatCurrency(booking?.totalAmount)}</span>
                    </div>
                  </div>

                  <button
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-4 font-black text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    disabled={!canPay || submitting}
                    onClick={handlePay}
                    type="button"
                  >
                    <span className="material-symbols-outlined">payments</span>
                    {isPaid ? 'Payment completed' : submitting ? 'Creating QR...' : 'Show PayOS QR'}
                  </button>

                  {!canPay ? (
                    <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">
                      {isPaid ? 'This booking is already paid.' : statusMeta.message}
                    </p>
                  ) : null}

                  {paymentDetails ? (
                    <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">PayOS session</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-[#a43c12]'}`}>
                          {paymentStatus}
                        </span>
                      </div>

                      {!isPaid && qrUrl ? (
                        <img className="mx-auto mt-4 w-full max-w-[260px] rounded-2xl border border-cyan-100 bg-white p-3" alt="PayOS QR" src={qrUrl} />
                      ) : !isPaid ? (
                        <div className="mt-4 rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-500">
                          PayOS checkout link is ready.
                        </div>
                      ) : null}

                      <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                        <PaymentInfoRow label="Order" value={paymentDetails.payosOrderCode} />
                        <PaymentInfoRow label="Amount" value={formatCurrency(paymentDetails.amount ?? booking?.totalAmount)} />
                        <PaymentInfoRow label="Payment status" value={paymentStatus} />
                        <PaymentInfoRow label="Booking status" value={effectiveStatus} />
                        <PaymentInfoRow label="Paid at" value={isPaid ? formatDateTime(paymentDetails.paidAt) : ''} />
                        <PaymentInfoRow label="Bank BIN" value={paymentSession?.bankBin} />
                        <PaymentInfoRow label="Account" value={paymentSession?.accountNumber} />
                        <PaymentInfoRow label="Account name" value={paymentSession?.accountName} />
                        <PaymentInfoRow label="Content" value={paymentSession?.description} />
                      </div>

                      {!isPaid && checkoutUrl ? (
                        <a
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-50"
                          href={checkoutUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className="material-symbols-outlined">open_in_new</span>
                          Open PayOS checkout
                        </a>
                      ) : null}

                      {!isPaid ? (
                        <button
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-cyan-700 px-5 py-3 font-black text-white hover:bg-cyan-800 disabled:bg-slate-300"
                          disabled={reconciling}
                          onClick={handleReconcile}
                          type="button"
                        >
                          <span className="material-symbols-outlined">sync</span>
                          {reconciling ? 'Checking PayOS...' : 'I have paid - Check payment status'}
                        </button>
                      ) : null}

                      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                        This page checks booking status every 3 seconds. Use the button above if the callback is delayed.
                      </p>
                    </div>
                  ) : null}

                  {isPaid ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center font-black text-emerald-700">
                      <span className="material-symbols-outlined">receipt_long</span>
                      <p className="mt-2">Payment confirmed. Opening the result page...</p>
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </MainLayout>
  );
}
