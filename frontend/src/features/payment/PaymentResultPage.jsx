import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';

const resultMeta = {
  success: {
    icon: 'verified',
    title: 'Payment confirmed',
    tone: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    message: 'Your booking is paid. QR tickets and email notification are being finalized.',
  },
  failed: {
    icon: 'error',
    title: 'Payment failed',
    tone: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
    message: 'The payment was not completed. Review your booking before trying again.',
  },
  pending: {
    icon: 'hourglass_empty',
    title: 'Payment processing',
    tone: 'text-[#a43c12]',
    badge: 'bg-yellow-100 text-[#a43c12] border-yellow-200',
    message: 'PayOS callback has not finished yet. This page will show the latest backend status.',
  },
};

function inferResult(searchStatus, booking, isMock) {
  const raw = searchStatus?.toLowerCase();
  if (isMock || !booking) {
    if (raw === 'success' || raw === 'paid') {
      return 'success';
    }
    if (raw === 'failed' || raw === 'cancelled' || raw === 'expired') {
      return 'failed';
    }
  }
  if (booking?.payment?.status === 'SUCCESS' || booking?.status === 'PAID') {
    return 'success';
  }
  if (['FAILED', 'EXPIRED'].includes(booking?.payment?.status) || ['FAILED', 'EXPIRED'].includes(booking?.status)) {
    return 'failed';
  }
  return 'pending';
}

function StatusCard({ icon, label, value, tone = 'text-cyan-700' }) {
  return (
    <article className="rounded-[1.25rem] border border-cyan-100 bg-white p-5 shadow-sm">
      <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 ${tone}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value || 'Pending'}</p>
    </article>
  );
}

function qrImageUrl(qrCode) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}`;
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const searchStatus = searchParams.get('status');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const isMock = searchParams.get('mock') === 'true' || bookingId === 'mock';

  useEffect(() => {
    let ignore = false;
    let intervalId;

    async function loadBooking() {
      if (!bookingId) {
        setLoading(false);
        return;
      }
      try {
        const detail = await getBookingDetail(bookingId, { status: searchStatus });
        if (!ignore) {
          setBooking(detail);
          setLastUpdatedAt(new Date());
          setError('');
          if (['PAID', 'FAILED', 'EXPIRED'].includes(detail?.status)) {
            window.clearInterval(intervalId);
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.response?.data?.message || loadError.message || 'Unable to load payment result.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBooking();
    intervalId = window.setInterval(loadBooking, 3000);
    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [bookingId, searchStatus]);

  const resultKey = inferResult(searchStatus, booking, isMock);
  const meta = resultMeta[resultKey];
  const processingItems = useMemo(
    () => [
      { icon: 'payments', label: 'Payment', value: booking?.payment?.status || (resultKey === 'success' ? 'SUCCESS' : 'PENDING'), tone: meta.tone },
      { icon: 'event_available', label: 'Booking', value: booking?.status || 'PENDING_PAYMENT', tone: meta.tone },
      { icon: 'qr_code_2', label: 'Tickets', value: booking?.tickets ? `${booking.tickets.valid}/${booking.tickets.total} valid` : 'Pending', tone: 'text-cyan-700' },
      { icon: 'outgoing_mail', label: 'Email', value: booking?.emailNotification?.status || 'Pending', tone: 'text-cyan-700' },
    ],
    [booking, meta.tone, resultKey],
  );
  const ticketItems = booking?.tickets?.items || [];

  return (
    <MainLayout>
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-[1.5rem] border border-cyan-100 bg-white p-8 text-center shadow-[0_16px_40px_rgba(8,145,178,0.10)] md:p-12">
            <span className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-50 ${meta.tone}`}>
              <span className="material-symbols-outlined !text-5xl">{meta.icon}</span>
            </span>
            <span className={`mt-6 inline-flex rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${meta.badge}`}>
              UC-20 / UC-21
            </span>
            <h1 className="mt-5 text-4xl font-black text-slate-950 md:text-5xl">{meta.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">{meta.message}</p>
            {resultKey === 'pending' && bookingId ? (
              <p className="mt-4 text-sm font-bold text-slate-500">
                Auto-refreshing every 3 seconds{lastUpdatedAt ? `, last checked ${lastUpdatedAt.toLocaleTimeString()}` : ''}.
              </p>
            ) : null}
            {error ? <p className="mx-auto mt-5 max-w-2xl rounded-2xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          </section>

          {loading ? (
            <section className="mt-8 rounded-[1.5rem] border border-cyan-100 bg-white p-10 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
              <p className="font-bold text-slate-600">Refreshing backend status...</p>
            </section>
          ) : (
            <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              {processingItems.map((item) => (
                <StatusCard key={item.label} {...item} />
              ))}
            </section>
          )}

          {ticketItems.length > 0 ? (
            <section className="mt-8 rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">UC-13 QR tickets</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Scan these tickets at the gate</h2>
                </div>
                <Link className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 hover:bg-cyan-100" to="/staff/tickets/validate">
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                  Staff validation
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {ticketItems.map((ticket, index) => (
                  <article className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4" key={ticket.id || ticket.qrCode}>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <img className="h-36 w-36 rounded-xl border border-cyan-100 bg-white p-2" alt={`Ticket QR ${index + 1}`} src={qrImageUrl(ticket.qrCode)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-slate-950">Ticket #{index + 1}</p>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">{ticket.status}</span>
                        </div>
                        <p className="mt-3 break-all rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-600">{ticket.qrCode}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {bookingId ? (
              <Link className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-3 font-black text-white hover:bg-cyan-800" to={`/bookings/${bookingId}`}>
                <span className="material-symbols-outlined">receipt_long</span>
                View booking
              </Link>
            ) : null}
            <Link className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-6 py-3 font-black text-cyan-700 hover:bg-cyan-50" to="/bookings/my">
              <span className="material-symbols-outlined">format_list_bulleted</span>
              My bookings
            </Link>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}
