import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';

const fallbackImageUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCUmOFDxfp1ajdCR_O_aNnBxoQW3_u9WMM17Kwe97LkjaLHN5KJ2N_vFKUHL6AZjvVZXtetw4139nIp60BEiaP-APZkoQEnBtM3ysqtwT6Lq0H1SBHw_poDS2Kl35kmV7ltWau4w3z2G7r98RflsVGSRceCx2YkW61nvRJ71zEzvMFUXQ9enPSVXjZWjvwS_TNgIZLS7PPXsSTs0LeU2eSFJXqoNrs7w4n5ErcAkgTYULV5F891qLia5q_mLesnJks4-sYQyPZZqA';

function secondsUntil(expiresAt) {
  if (!expiresAt) {
    return null;
  }

  const expiresAtTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtTime)) {
    return null;
  }

  return Math.max(0, Math.floor((expiresAtTime - Date.now()) / 1000));
}

function formatCountdown(seconds) {
  if (seconds === null) {
    return '--:--';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusConfig(status) {
  const configs = {
    PENDING_PAYMENT: {
      icon: 'hourglass_empty',
      tone: 'text-cyan-700 bg-cyan-100',
      badge: 'bg-yellow-100 text-[#a43c12]',
      alertTone: 'text-[#ff6900]',
      alertIcon: 'warning',
      headline: 'Hold tight! Your booking is almost ready.',
      title: 'Pending Payment',
      message: 'Your tickets are temporarily held while you complete payment.',
      warningTitle: 'Ticket Release Warning',
      warningMessage: 'Unpaid bookings are automatically released and seats are returned to the pool after 15 minutes.',
    },
    EXPIRED: {
      icon: 'timer_off',
      tone: 'text-red-600 bg-red-100',
      badge: 'bg-red-100 text-red-700',
      alertTone: 'text-red-600',
      alertIcon: 'block',
      headline: 'This booking hold has expired.',
      title: 'Expired',
      message: 'The checkout window ended and these tickets are no longer held.',
      warningTitle: 'Booking Hold Expired',
      warningMessage: 'Seats are returned to availability after the hold window ends.',
    },
    PAID: {
      icon: 'check_circle',
      tone: 'text-emerald-700 bg-emerald-100',
      badge: 'bg-emerald-100 text-emerald-700',
      alertTone: 'text-emerald-700',
      alertIcon: 'verified',
      headline: 'Your booking is paid.',
      title: 'Paid',
      message: 'Payment has been received for this booking.',
      warningTitle: 'Payment Confirmed',
      warningMessage: 'Ticket display and QR generation will be available in a later phase.',
    },
    FAILED: {
      icon: 'error',
      tone: 'text-red-600 bg-red-100',
      badge: 'bg-red-100 text-red-700',
      alertTone: 'text-red-600',
      alertIcon: 'error',
      headline: 'This booking could not be completed.',
      title: 'Failed',
      message: 'The booking did not complete successfully.',
      warningTitle: 'Booking Failed',
      warningMessage: 'Please try creating a new booking.',
    },
  };

  return configs[status] || configs.PENDING_PAYMENT;
}

function normalizeBooking(booking) {
  return {
    id: booking.id,
    bookingCode: booking.bookingCode || booking.id,
    showName: booking.showName || 'AquaPulse Show',
    showDate: booking.showDate,
    ticketType: booking.ticketType || 'STANDARD',
    quantity: booking.quantity ?? 0,
    unitPrice: booking.unitPrice,
    totalAmount: booking.totalAmount,
    status: booking.status || 'PENDING_PAYMENT',
    createdAt: booking.createdAt,
    expiresAt: booking.expiresAt,
    imageUrl: fallbackImageUrl,
  };
}

export default function BookingPendingPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBooking() {
      if (!id) {
        setLoadError('Booking ID is missing.');
        setIsLoadingBooking(false);
        return;
      }

      try {
        setIsLoadingBooking(true);
        setLoadError('');
        const bookingDetail = await getBookingDetail(id);
        if (!isMounted) {
          return;
        }

        setBooking(bookingDetail);
        setCountdownSeconds(secondsUntil(bookingDetail.expiresAt));
      } catch {
        if (!isMounted) {
          return;
        }

        setBooking(null);
        setLoadError('Could not load this booking. It may not exist or you may not have permission to view it.');
      } finally {
        if (isMounted) {
          setIsLoadingBooking(false);
        }
      }
    }

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!booking || booking.status !== 'PENDING_PAYMENT' || countdownSeconds === null || countdownSeconds === 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setCountdownSeconds((currentSeconds) => {
        if (currentSeconds === null) {
          return null;
        }

        return Math.max(0, currentSeconds - 1);
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [booking, countdownSeconds]);

  const displayBooking = useMemo(() => (booking ? normalizeBooking(booking) : null), [booking]);
  const effectiveStatus =
    displayBooking?.status === 'PENDING_PAYMENT' && countdownSeconds === 0 ? 'EXPIRED' : displayBooking?.status;
  const statusConfig = getStatusConfig(effectiveStatus);

  return (
    <MainLayout showNavbar={false}>
      <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-gradient-to-b from-cyan-50 via-white to-cyan-100 py-12 md:py-20">
        <div className="absolute left-[10%] top-20 h-20 w-20 rounded-full bg-cyan-300/20" />
        <div className="absolute right-[15%] top-60 h-32 w-32 rounded-full bg-teal-300/20" />
        <div className="absolute bottom-40 left-[20%] h-16 w-16 rounded-full bg-cyan-400/20" />
        <div className="absolute -right-20 bottom-24 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="absolute right-4 top-4 z-20 flex items-center sm:right-6 lg:right-8">
          <div className="flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-slate-200 backdrop-blur-md">
            <span className="text-sm font-semibold text-slate-600">
              Order ID: #{displayBooking?.bookingCode || id || 'Loading'}
            </span>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700"
              type="button"
              aria-label="Order ID help"
            >
              <span className="material-symbols-outlined text-lg">help</span>
            </button>
          </div>
        </div>

        {isLoadingBooking && (
          <section className="relative z-10 mx-auto flex min-h-[520px] max-w-4xl items-center justify-center px-4 pt-16 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-cyan-100 bg-white/90 p-8 text-center shadow-[0_20px_48px_rgba(0,0,0,0.05)] backdrop-blur-xl">
              <span className="material-symbols-outlined !text-5xl text-cyan-600">progress_activity</span>
              <h1 className="mt-4 text-3xl font-black text-cyan-800">Loading booking details...</h1>
              <p className="mt-2 text-slate-600">Please wait while AquaPulse retrieves your booking.</p>
            </div>
          </section>
        )}

        {!isLoadingBooking && loadError && (
          <section className="relative z-10 mx-auto flex min-h-[520px] max-w-4xl items-center justify-center px-4 pt-16 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-red-100 bg-white/90 p-8 text-center shadow-[0_20px_48px_rgba(0,0,0,0.05)] backdrop-blur-xl">
              <span className="material-symbols-outlined !text-5xl text-red-500">error</span>
              <h1 className="mt-4 text-3xl font-black text-cyan-800">Booking unavailable</h1>
              <p className="mt-2 text-slate-600">{loadError}</p>
            </div>
          </section>
        )}

        {!isLoadingBooking && !loadError && displayBooking && (
          <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pt-6 sm:px-6 lg:grid-cols-12 lg:px-8">
            <section className="flex flex-col justify-center space-y-8 lg:col-span-7">
              <div className="flex flex-col items-start space-y-4">
                <div className={['flex h-20 w-20 items-center justify-center rounded-full', statusConfig.tone].join(' ')}>
                  <span className="material-symbols-outlined !text-5xl animate-pulse">{statusConfig.icon}</span>
                </div>

                <span className={['inline-flex items-center rounded-full px-4 py-1.5 text-sm font-black shadow-sm', statusConfig.badge].join(' ')}>
                  <span className="material-symbols-outlined mr-2 text-sm">{statusConfig.alertIcon}</span>
                  {statusConfig.title}
                </span>

                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-cyan-800 md:text-6xl">
                  {statusConfig.headline}
                </h1>
                <p className="max-w-xl text-lg leading-8 text-slate-600">{statusConfig.message}</p>
              </div>

              {effectiveStatus === 'PENDING_PAYMENT' && (
                <div className="flex flex-col items-center gap-8 rounded-[2rem] border border-cyan-100 bg-white/80 p-8 shadow-[0_4px_20px_rgba(0,206,209,0.08)] backdrop-blur-xl md:flex-row">
                  <div className="text-center">
                    <div className="text-5xl font-black tracking-widest text-cyan-700">{formatCountdown(countdownSeconds)}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Minutes Remaining</div>
                  </div>
                  <div className="h-px w-full bg-cyan-100 md:h-16 md:w-px" />
                  <div className="flex-1">
                    <p className={['flex items-center gap-2 font-black', statusConfig.alertTone].join(' ')}>
                      <span className="material-symbols-outlined">{statusConfig.alertIcon}</span>
                      {statusConfig.warningTitle}
                    </p>
                    <p className="mt-1 text-slate-600">{statusConfig.warningMessage}</p>
                  </div>
                </div>
              )}

              {effectiveStatus !== 'PENDING_PAYMENT' && (
                <div className="rounded-[2rem] border border-cyan-100 bg-white/80 p-8 shadow-[0_4px_20px_rgba(0,206,209,0.08)] backdrop-blur-xl">
                  <p className={['flex items-center gap-2 font-black', statusConfig.alertTone].join(' ')}>
                    <span className="material-symbols-outlined">{statusConfig.alertIcon}</span>
                    {statusConfig.warningTitle}
                  </p>
                  <p className="mt-2 text-slate-600">{statusConfig.warningMessage}</p>
                </div>
              )}

              <div className="hidden flex-col items-start gap-3 lg:flex">
                {effectiveStatus === 'PENDING_PAYMENT' && (
                  <button className="rounded-full bg-slate-300 px-8 py-4 font-bold text-slate-600" disabled type="button">
                    Payment coming soon
                  </button>
                )}
                <BackHomeLink />
              </div>

            </section>

            <aside className="lg:col-span-5">
              <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_48px_rgba(0,0,0,0.05)]">
                <div className="relative h-48 overflow-hidden">
                  <img alt={displayBooking.showName} className="h-full w-full object-cover transition duration-700 hover:scale-110" src={displayBooking.imageUrl} />
                  <div className="absolute right-4 top-4 rounded-full bg-yellow-200 px-3 py-1 text-xs font-black text-slate-900">
                    {formatCurrency(displayBooking.totalAmount)}
                  </div>
                </div>

                <div className="space-y-6 p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-cyan-700">Booking Summary</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">AquaPulse ticket hold</p>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-cyan-200">confirmation_number</span>
                  </div>

                  <div className="space-y-4 border-t border-cyan-100 pt-4">
                    <SummaryRow label="Booking Code" value={displayBooking.bookingCode} />
                    <SummaryRow label="Show Name" value={displayBooking.showName} />
                    <SummaryRow label="Show Date" value={formatDate(displayBooking.showDate)} />
                    <SummaryRow label="Ticket Type" value={displayBooking.ticketType} />
                    <SummaryRow label="Quantity" value={displayBooking.quantity} />
                    <SummaryRow label="Unit Price" value={formatCurrency(displayBooking.unitPrice)} />
                    <SummaryRow label="Status" value={effectiveStatus} />
                    <SummaryRow label="Expires At" value={formatDateTime(displayBooking.expiresAt)} />
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-dashed border-cyan-100 pt-6">
                    <span className="text-xl font-black text-slate-950">Total Amount</span>
                    <span className="text-3xl font-black text-cyan-700">{formatCurrency(displayBooking.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-start gap-4 lg:hidden">
                {effectiveStatus === 'PENDING_PAYMENT' && (
                  <button className="w-full rounded-full bg-slate-300 py-4 font-bold text-slate-600" disabled type="button">
                    Payment coming soon
                  </button>
                )}
                <BackHomeLink />
              </div>
            </aside>
          </div>
        )}

        <svg className="absolute bottom-0 left-0 h-10 w-full text-cyan-50" preserveAspectRatio="none" viewBox="0 0 1200 120" aria-hidden="true">
          <path
            className="fill-current"
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50.31,34.54,121.57,56.09,190.72,64.31,235.15,69.59,279,64.29,321.39,56.44Z"
          />
        </svg>
      </main>
    </MainLayout>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{value || 'Not available'}</span>
    </div>
  );
}

function BackHomeLink() {
  return (
    <Link
      to="/"
      aria-label="Back Home"
      className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
    >
      <span className="text-lg leading-none" aria-hidden="true">←</span>
      <span>Back Home</span>
    </Link>
  );
}
