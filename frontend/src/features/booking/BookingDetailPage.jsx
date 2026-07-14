import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import { normalizeBookingPaymentStatus } from '../../shared/utils/paymentStatus.js';
import { formatCurrency, getTicketTypeLabel } from '../../shared/utils/ticketPricing.js';

const fallbackImageUrl =
  'https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA';

const statusMeta = {
  PROCESSING: {
    label: 'PROCESSING',
    title: 'Processing',
    headline: 'Your booking is still being processed.',
    message: 'AquaPulse is finalizing this booking request. Please check back shortly.',
    icon: 'progress_activity',
    badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    alertClassName: 'border-cyan-100 bg-cyan-50 text-cyan-800',
  },
  PENDING_PAYMENT: {
    label: 'PENDING_PAYMENT',
    title: 'Pending Payment',
    headline: 'Payment is still pending.',
    message: 'Your tickets are temporarily held while you complete payment.',
    icon: 'hourglass_empty',
    badgeClassName: 'border-yellow-200 bg-yellow-100 text-[#a43c12]',
    alertClassName: 'border-yellow-200 bg-yellow-50 text-[#a43c12]',
  },
  PAID: {
    label: 'PAID',
    title: 'Paid',
    headline: 'Payment completed.',
    message: 'Your AquaPulse reservation is confirmed.',
    icon: 'verified',
    badgeClassName: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    alertClassName: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  },
  EXPIRED: {
    label: 'EXPIRED',
    title: 'Expired',
    headline: 'This booking hold has expired.',
    message: 'The checkout window ended and these tickets are no longer held.',
    icon: 'timer_off',
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-600',
    alertClassName: 'border-slate-200 bg-slate-50 text-slate-600',
  },
  FAILED: {
    label: 'FAILED',
    title: 'Failed',
    headline: 'This booking could not be completed.',
    message: 'The booking did not complete successfully.',
    icon: 'error',
    badgeClassName: 'border-red-200 bg-red-100 text-red-700',
    alertClassName: 'border-red-200 bg-red-50 text-red-700',
  },
};

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getBookingErrorMessage(error) {
  if (error?.response?.status === 404) {
    return 'This booking was not found or you do not have permission to view it.';
  }

  return error?.response?.data?.message || 'Could not load this booking. Please try again.';
}

function normalizeBooking(booking) {
  const normalizedStatus = normalizeBookingPaymentStatus(booking, booking?.payment);
  const fallbackItem = {
    id: booking.id,
    showName: booking.showName || 'AquaPulse Show',
    startTime: booking.showDate,
    ticketType: booking.ticketType,
    quantity: booking.quantity ?? 0,
    unitPrice: booking.unitPrice,
    lineTotal: booking.totalAmount,
    imageUrl: fallbackImageUrl,
  };
  const items = (Array.isArray(booking.items) && booking.items.length > 0 ? booking.items : [fallbackItem]).map((item) => ({
    ...item,
    showName: item.showName || 'AquaPulse Show',
    ticketTypeLabel: getTicketTypeLabel(item.ticketType),
    imageUrl: item.imageUrl || fallbackImageUrl,
  }));
  const firstItem = items[0];
  return {
    id: booking.id,
    bookingCode: booking.bookingCode || booking.id,
    showName: firstItem.showName,
    showDate: firstItem.startTime || booking.showDate,
    ticketType: firstItem.ticketTypeLabel,
    quantity: booking.totalQuantity ?? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    unitPrice: firstItem.unitPrice,
    totalAmount: booking.totalAmount,
    status: normalizedStatus.status,
    bookingStatus: normalizedStatus.bookingStatus,
    paymentStatus: normalizedStatus.paymentStatus,
    createdAt: booking.createdAt,
    expiresAt: booking.expiresAt,
    payment: booking.payment || null,
    tickets: booking.tickets || null,
    emailNotification: booking.emailNotification || null,
    imageUrl: fallbackImageUrl,
    items,
  };
}

function StatusBadge({ meta }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-black tracking-wide ${meta.badgeClassName}`}>
      <span className="material-symbols-outlined mr-1 text-[16px]" aria-hidden="true">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

function DetailRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-cyan-50 py-3 last:border-b-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className={highlight ? 'text-right text-lg font-black text-cyan-700' : 'text-right font-bold text-slate-900'}>
        {value || 'Not available'}
      </span>
    </div>
  );
}

function ActionPanel({ booking }) {
  if (booking.status === 'PENDING_PAYMENT') {
    return (
      <>
        <Link
          className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 active:scale-[0.98]"
          to={`/bookings/${booking.id}/payment`}
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            payments
          </span>
          Continue Payment
        </Link>
      </>
    );
  }

  return null;
}

function StatusMessage({ booking, meta }) {
  if (booking.status === 'PAID') {
    const ticketCount = booking.tickets?.total || 0;
    return (
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
        {ticketCount > 0
          ? `${ticketCount} ticket QR code${ticketCount === 1 ? '' : 's'} generated.`
          : 'Payment was successful. Your QR ticket is being prepared...'}
      </p>
    );
  }

  if (booking.status === 'EXPIRED') {
    return <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">This booking hold has expired.</p>;
  }

  if (booking.status === 'FAILED') {
    return <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">This booking could not be completed.</p>;
  }

  return <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{meta.message}</p>;
}

function getJourneySteps(booking) {
  const createdTime = formatDateTime(booking.createdAt);
  const waitingTime = booking.expiresAt ? `Held until ${formatDateTime(booking.expiresAt)}` : 'Pending';

  const baseSteps = [
    {
      label: 'Booking Created',
      time: createdTime,
      icon: 'confirmation_number',
      state: 'waiting',
    },
    {
      label: 'Waiting for Payment',
      time: waitingTime,
      icon: 'hourglass_empty',
      state: 'waiting',
    },
    {
      label: 'Payment Completed',
      time: 'Pending',
      icon: 'payments',
      state: 'waiting',
    },
    {
      label: 'Ticket Ready',
      time: 'Coming soon',
      icon: 'qr_code_2',
      state: 'waiting',
    },
  ];

  if (booking.status === 'PROCESSING') {
    return baseSteps.map((step, index) => (index === 0 ? { ...step, state: 'current' } : step));
  }

  if (booking.status === 'PENDING_PAYMENT') {
    return baseSteps.map((step, index) => {
      if (index === 0) {
        return { ...step, state: 'complete' };
      }

      if (index === 1) {
        return { ...step, state: 'current' };
      }

      return step;
    });
  }

  if (booking.status === 'PAID') {
    return baseSteps.map((step, index) => {
      if (index <= 1) {
        return { ...step, state: 'complete' };
      }

      if (index === 2) {
        return { ...step, state: 'complete', time: 'Completed' };
      }

      return { ...step, state: booking.tickets?.total > 0 ? 'complete' : 'current', time: booking.tickets?.total > 0 ? 'Ready' : 'Coming soon' };
    });
  }

  if (booking.status === 'EXPIRED') {
    return baseSteps.map((step, index) => {
      if (index === 0) {
        return { ...step, state: 'complete' };
      }

      if (index === 1) {
        return { ...step, state: 'expired', time: booking.expiresAt ? `Expired ${formatDateTime(booking.expiresAt)}` : 'Expired' };
      }

      return step;
    });
  }

  if (booking.status === 'FAILED') {
    return baseSteps.map((step, index) => {
      if (index === 0) {
        return { ...step, state: booking.createdAt ? 'complete' : 'waiting' };
      }

      if (index === 1) {
        return { ...step, state: 'failed', time: 'Failed' };
      }

      return step;
    });
  }

  return baseSteps;
}

function getJourneyStepClassName(state) {
  const classes = {
    complete: 'bg-cyan-700 text-white shadow-lg shadow-cyan-700/20',
    current: 'bg-yellow-100 text-[#a43c12] shadow-lg shadow-yellow-200/50',
    failed: 'bg-red-600 text-white shadow-lg shadow-red-600/20',
    expired: 'bg-slate-500 text-white',
    waiting: 'bg-slate-100 text-slate-400',
  };

  return classes[state] || classes.waiting;
}

function BookingJourney({ booking }) {
  const steps = getJourneySteps(booking);

  return (
    <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)] md:p-8">
      <h4 className="text-2xl font-black text-slate-950">Booking Journey</h4>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        Track the booking lifecycle from booking hold to payment and ticket delivery.
      </p>

      <div className="relative mt-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="absolute left-6 top-6 hidden h-0.5 bg-cyan-100 md:left-[8%] md:right-[8%] md:block" />

        {steps.map((step) => (
          <div className="relative z-10 flex w-full items-center gap-4 md:w-1/4 md:flex-col md:text-center" key={step.label}>
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white ${getJourneyStepClassName(step.state)}`}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                {step.icon}
              </span>
            </div>
            <div>
              <span className="block text-sm font-black text-slate-900">{step.label}</span>
              <span className="mt-1 block text-[11px] font-bold text-slate-400">{step.time}</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadBooking() {
      if (!id) {
        setLoadError('Booking ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError('');
        const bookingDetail = await getBookingDetail(id);
        if (!isMounted) {
          return;
        }

        setBooking(bookingDetail);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          navigate('/login', { replace: true, state: { from: location } });
          return;
        }

        setBooking(null);
        setLoadError(getBookingErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [id, location, navigate]);

  useEffect(() => {
    const normalizedStatus = normalizeBookingPaymentStatus(booking, booking?.payment);
    if (normalizedStatus.status !== 'PAID' || Number(booking?.tickets?.total || 0) > 0) {
      return undefined;
    }

    let cancelled = false;
    const intervalId = window.setInterval(async () => {
      try {
        const bookingDetail = await getBookingDetail(id);
        if (!cancelled) {
          setBooking(bookingDetail);
        }
      } catch {
        // Keep the confirmed paid state and retry while the ticket generation task finishes.
      }
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [booking, id]);

  const displayBooking = useMemo(() => (booking ? normalizeBooking(booking) : null), [booking]);
  const bookingMeta = statusMeta[displayBooking?.status] || statusMeta.PROCESSING;

  return (
    <MainLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-900 via-cyan-700 to-teal-500 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute right-1/4 top-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-50">
            AquaPulse
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">Booking Detail</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-cyan-50/90">
            Review your AquaPulse reservation, schedule, payment status, and booking information.
          </p>
        </div>

        <svg className="absolute bottom-0 left-0 h-10 w-full text-cyan-50" preserveAspectRatio="none" viewBox="0 0 1200 120" aria-hidden="true">
          <path
            className="fill-current"
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50.31,34.54,121.57,56.09,190.72,64.31,235.15,69.59,279,64.29,321.39,56.44Z"
          />
        </svg>
      </section>

      <section className="bg-gradient-to-b from-white via-cyan-50/40 to-white px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        {isLoading && (
          <div className="mx-auto flex min-h-[420px] max-w-4xl items-center justify-center">
            <div className="rounded-[2rem] border border-cyan-100 bg-white p-8 text-center shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-700 border-t-transparent" />
              <h2 className="mt-4 text-3xl font-black text-slate-950">Loading booking detail...</h2>
              <p className="mt-2 text-slate-500">AquaPulse is retrieving your reservation.</p>
            </div>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="mx-auto flex min-h-[420px] max-w-4xl items-center justify-center">
            <div className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-[0_16px_40px_rgba(8,145,178,0.10)]" role="alert">
              <span className="material-symbols-outlined !text-5xl text-red-500">error</span>
              <h2 className="mt-4 text-3xl font-black text-slate-950">Booking unavailable</h2>
              <p className="mt-2 text-slate-500">{loadError}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link className="rounded-full bg-cyan-700 px-6 py-3 font-bold text-white transition hover:bg-cyan-800" to="/bookings/my">
                  Back to My Bookings
                </Link>
                <Link className="rounded-full border border-cyan-200 bg-white px-6 py-3 font-bold text-cyan-700 transition hover:bg-cyan-50" to="/">
                  Back Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !loadError && displayBooking && (
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)] md:p-8">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Booking Code</span>
                    <h2 className="mt-2 break-all text-3xl font-black text-slate-900">#{displayBooking.bookingCode}</h2>
                    <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
                      <span className="material-symbols-outlined text-base" aria-hidden="true">
                        calendar_today
                      </span>
                      Created on {formatDateTime(displayBooking.createdAt)}
                    </div>
                  </div>
                  <StatusBadge meta={bookingMeta} />
                </div>

                <div className={`mt-8 flex items-start gap-4 rounded-3xl border p-5 ${bookingMeta.alertClassName}`}>
                  <span className="material-symbols-outlined mt-0.5" aria-hidden="true">
                    {bookingMeta.icon}
                  </span>
                  <div>
                    <p className="text-sm font-black leading-7">{bookingMeta.headline}</p>
                    <StatusMessage booking={displayBooking} meta={bookingMeta} />
                  </div>
                </div>
              </article>

              <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)] md:p-8">
                <h3 className="text-3xl font-black text-slate-950">Selected Tickets</h3>
                <p className="mt-2 text-slate-600">Every show and ticket type included in this booking.</p>
                <div className="mt-6 space-y-4">
                  {displayBooking.items.map((item) => (
                    <div className="grid gap-4 rounded-3xl border border-cyan-100 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center" key={item.id}>
                      <img alt={item.showName} className="h-24 w-24 rounded-2xl object-cover" src={item.imageUrl} />
                      <div>
                        <h4 className="text-lg font-black text-slate-950">{item.showName}</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{formatDateTime(item.startTime)} · {item.venueName || 'Venue to be announced'}</p>
                        <p className="mt-1 text-sm font-bold text-cyan-700">{item.ticketTypeLabel} · {item.quantity} ticket{Number(item.quantity) === 1 ? '' : 's'} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <span className="text-lg font-black text-cyan-700">{formatCurrency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <BookingJourney booking={displayBooking} />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
              <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
                <h4 className="text-2xl font-black text-slate-950">Order Summary</h4>
                <div className="mt-6">
                  <DetailRow label="Booking Code" value={displayBooking.bookingCode} />
                  <DetailRow label="Show Lines" value={displayBooking.items.length} />
                  <DetailRow label="Total Tickets" value={displayBooking.quantity} />
                  <DetailRow label="Created At" value={formatDateTime(displayBooking.createdAt)} />
                  <DetailRow label="Expires At" value={formatDateTime(displayBooking.expiresAt)} />
                  <DetailRow label="Status" value={displayBooking.status} />
                  <DetailRow label="Payment" value={displayBooking.paymentStatus} />
                  <DetailRow label="Tickets" value={`${displayBooking.tickets?.total || 0} generated`} />
                  <DetailRow label="Email" value={displayBooking.emailNotification?.status || 'Pending'} />
                  <DetailRow label="Booking ID" value={displayBooking.id} />
                </div>
                <div className="mt-6 border-t-2 border-dashed border-cyan-100 pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Total Amount</span>
                    <span className="text-3xl font-black text-cyan-700">{formatCurrency(displayBooking.totalAmount)}</span>
                  </div>
                </div>
              </article>

              <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
                <h4 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Actions</h4>
                <div className="mt-5 flex flex-col gap-3">
                  <ActionPanel booking={displayBooking} />
                  {displayBooking.status === 'PAID' && Number(displayBooking.tickets?.total || 0) > 0 ? (
                    <Link
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
                      to={`/my-tickets?bookingId=${encodeURIComponent(displayBooking.id)}`}
                    >
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">
                        qr_code_2
                      </span>
                      View Tickets
                    </Link>
                  ) : null}
                  <Link
                    className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-6 py-4 font-bold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50 active:scale-[0.98]"
                    to="/bookings/my"
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      arrow_back
                    </span>
                    Back to My Bookings
                  </Link>
                  <Link
                    className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-cyan-100 bg-cyan-50 px-6 py-4 font-bold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 active:scale-[0.98]"
                    to="/"
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      home
                    </span>
                    Back Home
                  </Link>
                </div>
              </article>
            </aside>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div>
        <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
        <span className="mt-1 block break-all text-lg font-black text-slate-900">{value || 'Not available'}</span>
      </div>
    </div>
  );
}
