import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import { createPayment } from '../../services/paymentService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount || 0));
}

function formatDateTime(value) {
  return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Pending schedule';
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}

function getInitialSeconds(expiredAt) {
  if (!expiredAt) {
    return 0;
  }
  return Math.max(0, Math.floor((new Date(expiredAt).getTime() - Date.now()) / 1000));
}

function ticketQrImageUrl(qrCode) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`;
}

function statusBadgeClass(status, isExpired) {
  if (status === 'PAID') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (isExpired || status === 'FAILED') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-yellow-100 text-[#a43c12]';
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadBooking() {
      try {
        const detail = await getBookingDetail(bookingId);
        if (!ignore) {
          setBooking(detail);
          setCountdownSeconds(getInitialSeconds(detail.expiresAt || detail.expiredAt));
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.response?.data?.message || loadError.message || 'Unable to load booking.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBooking();
    return () => {
      ignore = true;
    };
  }, [bookingId]);

  useEffect(() => {
    if (countdownSeconds <= 0) {
      return undefined;
    }
    const timerId = window.setInterval(() => {
      setCountdownSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [countdownSeconds]);

  useEffect(() => {
    if (!paymentSession || booking?.status === 'PAID') {
      return undefined;
    }

    let ignore = false;
    const intervalId = window.setInterval(async () => {
      try {
        const detail = await getBookingDetail(bookingId);
        if (!ignore) {
          setBooking(detail);
          if (detail?.status === 'PAID') {
            window.clearInterval(intervalId);
          }
        }
      } catch {
        // Keep the payment screen stable while PayOS callback is still being processed.
      }
    }, 3000);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [bookingId, booking?.status, paymentSession]);

  const isExpired = booking?.status !== 'PAID' && (countdownSeconds === 0 || booking?.status === 'EXPIRED');
  const canPay = booking?.status === 'PENDING_PAYMENT' && !isExpired;
  const ticketItems = booking?.tickets?.items || [];
  const backendPaymentStatus = booking?.payment?.status;
  const displayPaymentStatus = backendPaymentStatus || paymentSession?.status || 'PENDING';
  const isPaid = booking?.status === 'PAID' || backendPaymentStatus === 'SUCCESS';

  const paymentSteps = useMemo(
    () => [
      { label: 'Booking held', icon: 'task_alt', active: true },
      { label: 'PayOS checkout', icon: 'payments', active: canPay || isPaid },
      { label: 'QR tickets', icon: 'qr_code_2', active: isPaid },
      { label: 'Email sent', icon: 'outgoing_mail', active: booking?.emailNotification?.status === 'SENT' },
    ],
    [booking, canPay, isPaid],
  );

  const handlePay = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payment = await createPayment(bookingId);
      setPaymentSession(payment);
    } catch (payError) {
      setError(payError.response?.data?.message || payError.message || 'Unable to start payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const qrImageUrl = paymentSession?.bankBin && paymentSession?.accountNumber
    ? `https://img.vietqr.io/image/${paymentSession.bankBin}-${paymentSession.accountNumber}-compact2.png?amount=${Number(paymentSession.amount || booking?.totalAmount || 0)}&addInfo=${encodeURIComponent(paymentSession.description || paymentSession.payosOrderCode)}&accountName=${encodeURIComponent(paymentSession.accountName || 'ASMS')}`
    : null;

  return (
    <MainLayout>
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="inline-flex rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-800">UC-10 Payment</p>
              <h1 className="mt-4 text-4xl font-black text-slate-950 md:text-5xl">Complete payment</h1>
              <p className="mt-3 max-w-2xl text-slate-600">PayOS checkout for your reserved AquaPulse booking.</p>
            </div>
            <Link className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-bold text-cyan-700 hover:bg-cyan-50" to={`/bookings/${bookingId}`}>
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              Booking detail
            </Link>
          </div>

          {loading ? (
            <section className="rounded-[1.5rem] border border-cyan-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
              <p className="font-bold text-slate-600">Loading booking...</p>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <section className="space-y-6 lg:col-span-8">
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>
                ) : null}

                <article className="overflow-hidden rounded-[1.5rem] border border-cyan-100 bg-white shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
                  <div className="relative h-72 overflow-hidden">
                    <img alt={booking?.show?.title || booking?.showName || 'AquaPulse show'} className="h-full w-full object-cover" src={booking?.show?.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80'} />
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/80 via-cyan-950/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100">{booking?.schedule?.venueName || 'Main Plaza Pool'}</p>
                      <h2 className="mt-2 text-3xl font-black">{booking?.show?.title || booking?.showName}</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                    <div className="rounded-2xl bg-cyan-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Schedule</p>
                      <p className="mt-2 font-black text-slate-900">{formatDateTime(booking?.schedule?.startTime || booking?.showDate)}</p>
                    </div>
                    <div className="rounded-2xl bg-cyan-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Tickets</p>
                      <p className="mt-2 font-black text-slate-900">{booking?.totalQuantity || booking?.quantity} tickets</p>
                    </div>
                    <div className="rounded-2xl bg-cyan-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Total</p>
                      <p className="mt-2 text-2xl font-black text-cyan-700">{formatCurrency(booking?.totalAmount)}</p>
                    </div>
                  </div>
                </article>

                {ticketItems.length > 0 ? (
                  <article className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Paid booking</p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">QR tickets are ready</h3>
                      </div>
                      <Link className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-700 px-5 py-3 text-sm font-black text-white hover:bg-cyan-800" to={`/payments/result?bookingId=${bookingId}&status=success`}>
                        <span className="material-symbols-outlined">receipt_long</span>
                        Payment result
                      </Link>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {ticketItems.map((ticket, index) => (
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4" key={ticket.id || ticket.qrCode}>
                          <img className="mx-auto h-40 w-40 rounded-xl border border-cyan-100 bg-white p-2" alt={`Ticket QR ${index + 1}`} src={ticketQrImageUrl(ticket.qrCode)} />
                          <p className="mt-3 text-center text-sm font-black text-slate-900">Ticket #{index + 1}</p>
                          <p className="mt-2 break-all rounded-xl bg-white p-3 text-xs font-semibold text-slate-500">{ticket.qrCode}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ) : null}

                <article className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">Payment flow</h3>
                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {paymentSteps.map((step) => (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4" key={step.label}>
                        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${step.active ? 'bg-cyan-700 text-white' : 'bg-white text-slate-400'}`}>
                          <span className="material-symbols-outlined">{step.icon}</span>
                        </span>
                        <p className="mt-3 text-sm font-black text-slate-800">{step.label}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <aside className="lg:sticky lg:top-28 lg:col-span-4">
                <div className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Hold timer</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadgeClass(booking?.status, isExpired)}`}>
                      {isExpired ? 'EXPIRED' : booking?.status}
                    </span>
                  </div>
                  <div className={`mt-5 text-center ${isPaid ? 'text-4xl' : 'text-6xl tracking-widest'} font-black ${isExpired ? 'text-red-600' : isPaid ? 'text-emerald-700' : 'text-cyan-700'}`}>
                    {isPaid ? 'PAID' : formatCountdown(countdownSeconds)}
                  </div>
                  <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                    {isPaid
                      ? 'Payment completed. QR tickets are ready below and have been sent to the customer email.'
                      : isExpired
                        ? 'This booking can no longer be paid. Create a new booking to reserve seats again.'
                        : 'Complete PayOS checkout before the temporary hold expires.'}
                  </p>
                  <button
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-4 font-black text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    disabled={!canPay || submitting}
                    onClick={handlePay}
                    type="button"
                  >
                    <span className="material-symbols-outlined">payments</span>
                    {isPaid ? 'Payment completed' : submitting ? 'Opening PayOS...' : 'Pay with PayOS'}
                  </button>
                  {paymentSession || booking?.payment ? (
                    <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">PayOS QR</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${displayPaymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-[#a43c12]'}`}>{displayPaymentStatus}</span>
                      </div>
                      {qrImageUrl ? (
                        <img className="mx-auto mt-4 w-full max-w-[260px] rounded-2xl border border-cyan-100 bg-white p-3" alt="PayOS VietQR" src={qrImageUrl} />
                      ) : (
                        <div className="mt-4 rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-500">
                          PayOS checkout link is ready.
                        </div>
                      )}
                      <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                        <div className="flex justify-between gap-3">
                          <span>Order</span>
                          <span className="text-right font-black text-slate-900">{paymentSession?.payosOrderCode || booking?.payment?.payosOrderCode}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Amount</span>
                          <span className="font-black text-cyan-700">{formatCurrency(paymentSession?.amount || booking?.payment?.amount || booking?.totalAmount)}</span>
                        </div>
                        {paymentSession?.accountNumber ? (
                          <div className="flex justify-between gap-3">
                            <span>Account</span>
                            <span className="text-right font-black text-slate-900">{paymentSession.accountNumber}</span>
                          </div>
                        ) : null}
                        {paymentSession?.description ? (
                          <div className="flex justify-between gap-3">
                            <span>Content</span>
                            <span className="text-right font-black text-slate-900">{paymentSession.description}</span>
                          </div>
                        ) : null}
                      </div>
                      {paymentSession?.checkoutUrl || paymentSession?.paymentUrl ? (
                        <a
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-50"
                        href={paymentSession.checkoutUrl || paymentSession.paymentUrl}
                        rel="noreferrer"
                        target="_blank"
                        >
                          <span className="material-symbols-outlined">open_in_new</span>
                          Open PayOS checkout
                        </a>
                      ) : null}
                      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                        Sau khi bạn thanh toán, PayOS webhook sẽ cập nhật booking. Trang này tự kiểm tra lại mỗi 3 giây và hiện QR ticket khi booking chuyển sang PAID.
                      </p>
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
