import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';

const initialCountdownSeconds = 13 * 60 + 21;

const mockBooking = {
  id: 'AQ-882190',
  bookingCode: 'AQ-882190',
  showName: 'Symphony of Lights',
  showDate: '2024-10-24',
  dateTime: 'Oct 24, 2024 - 08:30 PM',
  venue: 'Aqua Plaza',
  ticketType: 'Standard Entry',
  status: 'PENDING_PAYMENT',
  expiresAt: null,
  quantity: '2 Adult Tickets',
  totalAmount: '$45.00',
  imageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCUmOFDxfp1ajdCR_O_aNnBxoQW3_u9WMM17Kwe97LkjaLHN5KJ2N_vFKUHL6AZjvVZXtetw4139nIp60BEiaP-APZkoQEnBtM3ysqtwT6Lq0H1SBHw_poDS2Kl35kmV7ltWau4w3z2G7r98RflsVGSRceCx2YkW61nvRJ71zEzvMFUXQ9enPSVXjZWjvwS_TNgIZLS7PPXsSTs0LeU2eSFJXqoNrs7w4n5ErcAkgTYULV5F891qLia5q_mLesnJks4-sYQyPZZqA',
};

const mockUser = {
  name: 'Marina Blue Waters',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Ktsr2eh2zseRpqmcWc1jQ2IUGLAARYiIysbobKUntDOh1nfDEifzPo42cD1xCI3T5oWurk7H1oKkKP_l2LrvMSTbQqGTFw60SUPYoNNMIv3gfUV3GqpU11JvrHJJDZgeCC_B5r0q8iYCRft-Kxz2bcJz_sWISuXeYsix-dHPCFCu7EefAYCNtuwQt1sSeMzD1LYvsG6zg6WcWlfRAxuW6RJDQt2u2lZ8PPXPaVPdz65gIS2xSH4QbYVkuUlpX6vy3tt5-fusYw',
};

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function secondsUntil(expiresAt) {
  if (!expiresAt) {
    return initialCountdownSeconds;
  }

  const expiresAtTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtTime)) {
    return initialCountdownSeconds;
  }

  return Math.max(0, Math.floor((expiresAtTime - Date.now()) / 1000));
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '$0.00';
  }

  return `$${amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function normalizeBooking(booking) {
  if (!booking) {
    return mockBooking;
  }

  return {
    id: booking.id,
    bookingCode: booking.bookingCode || booking.id,
    showName: booking.showName || mockBooking.showName,
    showDate: booking.showDate,
    dateTime: formatDate(booking.showDate),
    venue: mockBooking.venue,
    ticketType: booking.ticketType || 'Standard Entry',
    status: booking.status || 'PENDING_PAYMENT',
    expiresAt: booking.expiresAt,
    quantity: `${booking.quantity || 0} ${booking.ticketType || 'Tickets'}`,
    totalAmount: formatCurrency(booking.totalAmount),
    imageUrl: mockBooking.imageUrl,
  };
}

export default function BookingPendingPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(initialCountdownSeconds);
  const displayBooking = normalizeBooking(booking);
  const isExpired = displayBooking.status === 'EXPIRED' || countdownSeconds === 0;
  const status = isExpired ? 'EXPIRED' : displayBooking.status;

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
        setLoadError('Could not load booking details. Showing a temporary preview instead.');
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
    if (countdownSeconds === 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setCountdownSeconds((currentSeconds) => Math.max(0, currentSeconds - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [countdownSeconds]);

  const handleContinue = () => {};
  const detailHref = id ? `/bookings/${id}` : '/bookings/my';

  return (
    <MainLayout navbarProps={{ isLoggedIn: true, user: mockUser }} showNavbar={false}>
      <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-gradient-to-b from-cyan-50 via-white to-cyan-100 py-12 md:py-20">
        <div className="absolute left-[10%] top-20 h-20 w-20 rounded-full bg-cyan-300/20" />
        <div className="absolute right-[15%] top-60 h-32 w-32 rounded-full bg-teal-300/20" />
        <div className="absolute bottom-40 left-[20%] h-16 w-16 rounded-full bg-cyan-400/20" />
        <div className="absolute -right-20 bottom-24 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="absolute right-4 top-4 z-20 flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-slate-200 backdrop-blur-md sm:right-6 lg:right-8">
          <span className="text-sm font-semibold text-slate-600">Order ID: #{displayBooking.bookingCode}</span>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700"
            type="button"
            aria-label="Order ID help"
          >
            <span className="material-symbols-outlined text-lg">help</span>
          </button>
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pt-12 sm:px-6 lg:grid-cols-12 lg:px-8">
          <section className="flex flex-col justify-center space-y-8 lg:col-span-7">
            <div className="flex flex-col items-start space-y-4">
              <div
                className={[
                  'flex h-20 w-20 items-center justify-center rounded-full',
                  isExpired ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-700',
                ].join(' ')}
              >
                <span className="material-symbols-outlined !text-5xl animate-pulse">
                  {isExpired ? 'timer_off' : 'hourglass_empty'}
                </span>
              </div>

              <span
                className={[
                  'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-black shadow-sm',
                  isExpired ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-[#a43c12]',
                ].join(' ')}
              >
                <span className="material-symbols-outlined mr-2 text-sm">{isExpired ? 'error' : 'warning'}</span>
                {status}
              </span>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-cyan-800 md:text-6xl">
                {isExpired ? 'Your booking hold has expired.' : 'Hold tight! Your booking is almost ready.'}
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                {isExpired
                  ? 'The checkout window ended and these seats are no longer held. Please create a new booking when you are ready.'
                  : `We created your reservation for ${displayBooking.showName}. To guarantee your seats, please continue before the timer expires.`}
              </p>
            </div>

            {(isLoadingBooking || loadError) && (
              <div
                className={[
                  'rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm',
                  loadError ? 'border-yellow-100 bg-yellow-50 text-yellow-800' : 'border-cyan-100 bg-white/80 text-cyan-800',
                ].join(' ')}
                role={loadError ? 'alert' : 'status'}
              >
                {isLoadingBooking ? 'Loading booking details...' : loadError}
              </div>
            )}

            <div className="flex flex-col items-center gap-8 rounded-[2rem] border border-cyan-100 bg-white/80 p-8 shadow-[0_4px_20px_rgba(0,206,209,0.08)] backdrop-blur-xl md:flex-row">
              <div className="text-center">
                <div className={['text-5xl font-black tracking-widest', isExpired ? 'text-red-600' : 'text-cyan-700'].join(' ')}>
                  {formatCountdown(countdownSeconds)}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  {isExpired ? 'Window Closed' : 'Minutes Remaining'}
                </div>
              </div>
              <div className="h-px w-full bg-cyan-100 md:h-16 md:w-px" />
              <div className="flex-1">
                <p className={['flex items-center gap-2 font-black', isExpired ? 'text-red-600' : 'text-[#ff6900]'].join(' ')}>
                  <span className="material-symbols-outlined">{isExpired ? 'block' : 'warning'}</span>
                  {isExpired ? 'Booking Hold Expired' : 'Ticket Release Warning'}
                </p>
                <p className="mt-1 text-slate-600">
                  {isExpired
                    ? 'Seats are returned to availability after the hold window ends.'
                    : 'Unpaid bookings are automatically released and seats are returned to the pool after 15 minutes.'}
                </p>
              </div>
            </div>

            <div className="hidden flex-col items-center gap-4 lg:flex lg:flex-row">
              {isExpired ? (
                <button
                  className="rounded-full bg-slate-300 px-8 py-4 font-bold text-slate-600"
                  disabled
                  type="button"
                >
                  Payment Window Expired
                </button>
              ) : (
                <button
                  className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-800 px-8 py-4 font-bold text-white shadow-lg transition hover:scale-105"
                  onClick={handleContinue}
                  type="button"
                >
                  Continue to Payment
                </button>
              )}
              <a
                className="rounded-full border-2 border-cyan-700 bg-white px-8 py-4 font-bold text-cyan-700 transition hover:bg-cyan-50"
                href={detailHref}
              >
                View Booking Detail
              </a>
            </div>

            <a className="hidden items-center gap-2 font-bold text-cyan-700 underline-offset-4 hover:underline lg:inline-flex" href="/">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Home
            </a>
          </section>

          <aside className="lg:col-span-5">
            <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_48px_rgba(0,0,0,0.05)]">
              <div className="relative h-48 overflow-hidden">
                <img alt={displayBooking.showName} className="h-full w-full object-cover transition duration-700 hover:scale-110" src={displayBooking.imageUrl} />
                <div className="absolute right-4 top-4 rounded-full bg-yellow-200 px-3 py-1 text-xs font-black text-slate-900">
                  {displayBooking.totalAmount}
                </div>
              </div>

              <div className="space-y-6 p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-cyan-700">Booking Summary</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{displayBooking.bookingCode}</p>
                  </div>
                  <span className="material-symbols-outlined text-4xl text-cyan-200">confirmation_number</span>
                </div>

                <div className="space-y-4 border-t border-cyan-100 pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Show Name</span>
                    <span className="font-bold text-slate-900">{displayBooking.showName}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Show Date</span>
                    <span className="text-right font-bold text-slate-900">{displayBooking.dateTime}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Ticket Type</span>
                    <span className="font-bold text-slate-900">{displayBooking.ticketType}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Quantity</span>
                    <span className="font-bold text-slate-900">{displayBooking.quantity}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Status</span>
                    <span className="font-bold text-slate-900">{status}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Expires At</span>
                    <span className="text-right font-bold text-slate-900">{displayBooking.expiresAt ? formatDate(displayBooking.expiresAt) : 'Not available'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t-2 border-dashed border-cyan-100 pt-6">
                  <span className="text-xl font-black text-slate-950">Total Amount</span>
                  <span className="text-3xl font-black text-cyan-700">{displayBooking.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 lg:hidden">
              {isExpired ? (
                <button className="w-full rounded-full bg-slate-300 py-4 font-bold text-slate-600" disabled type="button">
                  Payment Window Expired
                </button>
              ) : (
                <button
                  className="w-full rounded-full bg-gradient-to-r from-cyan-600 to-teal-800 py-4 font-bold text-white shadow-lg"
                  onClick={handleContinue}
                  type="button"
                >
                  Continue to Payment
                </button>
              )}
              <a className="w-full rounded-full border-2 border-cyan-700 bg-white py-4 text-center font-bold text-cyan-700" href={detailHref}>
                View Booking Detail
              </a>
              <a className="py-2 text-center font-bold text-cyan-700" href="/">
                Back to Home
              </a>
            </div>
          </aside>
        </div>

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
