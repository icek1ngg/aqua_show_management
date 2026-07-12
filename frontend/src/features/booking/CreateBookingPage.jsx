import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { createBooking } from '../../services/bookingService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import {
  formatCurrency,
  getTicketTypeLabel,
  getTicketTypePrice,
  normalizeTicketType,
} from '../../shared/utils/ticketPricing.js';

// TEMPORARY / FRONTEND-ONLY mock database of show options
const showDatabase = {
  'Symphony of Lights': {
    name: 'Symphony of Lights',
    category: 'Water Show',
    badge: 'Popular',
    maxQuantity: 10,
    time: '08:00 PM - 09:30 PM',
    venue: 'Aqua Plaza',
    description: "Witness the world's most advanced synchronized water performance. A breathtaking choreography of 50-foot water jets, 4K laser projections, and an orchestral soundtrack that will leave you spellbound.",
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQJ-Fo4HDO72JbLax0CiFqctWCGXvU4YEfKNT6BKoii53LhvXYm3tK9deyNpu3SQhQuDwXH4brHWFob4XTMXC0igb1FTIelijgurjSK40wqc_V-h4hB2iXApJSw4tuIL9RRKwcdhGhhcgV9V5pOtwPQGvlVc5CRVwmmWl5xWGLSkDEXdqrpRF327LZc7RzHHIIOK5u5seDmxx49urrFLxksqEEDJ5_xPJn8EULd2-53B3FmPiCpcXrt3oMMoWR8T3lZdXTQe3xXQ',
  },
  'Ocean Dreams': {
    name: 'Ocean Dreams',
    category: 'Marine Show',
    badge: 'Trending',
    maxQuantity: 10,
    time: '02:00 PM - 03:30 PM',
    venue: 'Marine Amphitheater',
    description: 'Dive into the magical world of our ocean friends. A heartwarming and educational showcase featuring intelligent dolphins, playful sea lions, and majestic penguins.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLkcsyUKlIImgmce-9G2dAo8GcDQHC4tMU_HtQpL0TEZHFnZMA593upxVQv7NP_8xUJLFZ9UhPc2TkLmRBIwG4nADjfrcPCCV1OcprAX9PJYRROaEPTJIr9XSSsURgaOernS9YgRdb06XKur09aBAzonxwlnjCul3WOZ_hy89pXKbtzNbQMxBkKc-JLsrTQN5WL9Qd5ekbJS4-Q_1eRRxp5L5pm-iG_pY2SQwZkYFcKXI6Ead_uy9WTRTwJK2BTK1zLuqph8bxCQ',
  },
  'Aqua Parade': {
    name: 'Aqua Parade',
    category: 'Float Parade',
    badge: 'Festive',
    maxQuantity: 10,
    time: '04:30 PM - 05:30 PM',
    venue: 'Canal Street',
    description: 'A vibrant celebration on water! Watch stunningly decorated floats, acrobats, and dancers parade down the canals in a burst of music, lights, and color.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCujaSo6RV1Zoca54QEd2IVZ0mAIhk-vMjIjrWZ7vuCp0P6wllTuqPk4C8vUmNCkvR3RIODJ1oFmeSH8MZ-G37u1qMR5SGvZxUPPJnMsqk3L4KrtxQarbpM4eTByeZzXqJBfd1vj5K372GpP8Ayu4fBjMoU297quKk5Ks1Zu3OJVF7JnLc7tv52VksRq713j_R4nTLp2eF5SXS-k8LDvGqMXUTAVexCDC4W2CRrf9wRyqfIIqm9G3VrZTqy0eU7D4yRB5CiNTWJug',
  },
  'Mermaid Splash': {
    name: 'Mermaid Splash',
    category: 'Underwater Theater',
    badge: 'Magical',
    maxQuantity: 10,
    time: '11:00 AM - 12:30 PM',
    venue: 'Deep Ocean Tank',
    description: 'Believe in magic with our beautiful mermaids performing synchronized swimming, acrobatics, and storytelling in our giant deep ocean aquarium.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAs3NVAK7aoUYuYTZX3AmIWjo37TVxp8y6qJgQ9aCIxerTaTrUNtCZg6IkvjGYTrm8NkWAmMk9EYSAS0zHX-Ybuchms5PmzM8GSFwWEwlI4Yo9RrGTNwDjP0uBNcrI0GEVscCdtCQdMPXEMe6JZqLjxpYxC0m-dniRVU5w8F3YNuK1ONb9aqNtSQ8JjTFMnaKVdluoElQViAQ2wGLue9tKyOx3JFBWEQNJawzk2cibhFjqAkAmwOrkKMOymHdXyYfPgbQ1y6XgQQ',
  }
};

function formatDateString(dateStr) {
  if (!dateStr) return 'Not selected';
  try {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getBookingErrorMessage(error) {
  const status = error?.response?.status;
  const responseData = error?.response?.data;

  if (status === 401) {
    return 'Please sign in to create a booking.';
  }

  if (status === 409) {
    return 'Not enough tickets available.';
  }

  if (status === 503) {
    return 'Booking service is temporarily unavailable. Please try again shortly.';
  }

  if (responseData?.errors) {
    return Object.values(responseData.errors).filter(Boolean).join(' ');
  }

  return responseData?.message || 'Could not create booking. Please try again.';
}

function isUuid(value) {
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value || '');
}

function validateBookingPayload(payload) {
  if (!payload.scheduleId || !isUuid(payload.scheduleId)) {
    return 'Please select a show schedule again.';
  }
  if (!payload.showId || !isUuid(payload.showId)) {
    return 'Please select a show again.';
  }
  if (!payload.showName || !payload.showDate || !payload.ticketType) {
    return 'Show, date, and ticket type are required.';
  }
  if (!Number.isInteger(payload.quantity) || payload.quantity < 1 || payload.quantity > 10) {
    return 'Quantity must be a number from 1 to 10.';
  }
  return '';
}

function getMissingBookingParams({
  showId,
  scheduleId,
  showName,
  showDate,
  quantity,
  ticketType,
}) {
  return [
    !showId && 'showId',
    !scheduleId && 'scheduleId',
    !showName && 'show',
    !showDate && 'date',
    (!Number.isInteger(quantity) || quantity < 1) && 'quantity',
    !ticketType && 'ticketType',
  ].filter(Boolean);
}

export default function CreateBookingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve URL search parameters
  const showIdParam = searchParams.get('showId');
  const scheduleIdParam = searchParams.get('scheduleId');
  const showNameParam = searchParams.get('show');
  const dateParam = searchParams.get('date');
  const quantityParam = Number(searchParams.get('quantity'));
  const ticketTypeQueryParam = searchParams.get('ticketType');
  const ticketTypeParam = normalizeTicketType(ticketTypeQueryParam || 'STANDARD');
  const ticketTypeLabel = getTicketTypeLabel(ticketTypeParam);

  // State management
  const [quantity, setQuantity] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [bookingStatusMessage, setBookingStatusMessage] = useState('');
  const [submitState, setSubmitState] = useState('idle');
  const isBookingInProgress = submitState === 'creating';

  // Handle query parameter updates and synchronization
  useEffect(() => {
    if (quantityParam && Number.isInteger(quantityParam) && quantityParam >= 1) {
      setQuantity(quantityParam);
    }
  }, [quantityParam]);

  // Check if required params are missing
  const isScheduleMissing = !scheduleIdParam;
  const missingParams = getMissingBookingParams({
    showId: showIdParam,
    scheduleId: scheduleIdParam,
    showName: showNameParam,
    showDate: dateParam,
    quantity: quantityParam,
    ticketType: ticketTypeQueryParam,
  });
  const isParamsMissing = missingParams.length > 0;
  const missingParamsDetail = import.meta.env.DEV && missingParams.length > 0
    ? ` Missing parameters: ${missingParams.join(', ')}.`
    : '';

  if (isParamsMissing) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 mb-8 border border-cyan-100 shadow-sm animate-pulse">
            <span className="material-symbols-outlined text-4xl">confirmation_number</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Select Tickets to Continue</h1>
          <p className="mt-4 text-base text-slate-600 max-w-md">
            {isScheduleMissing
              ? `Please select a show schedule again.${missingParamsDetail}`
              : `Please search for a show, date, and ticket quantity using the Ticket Search Drawer to start your booking.${missingParamsDetail}`}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row w-full sm:w-auto px-4">
            <button
              className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-800 px-10 py-4 font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
              onClick={() => window.dispatchEvent(new CustomEvent('aquapulse:open-ticket-drawer'))}
              type="button"
            >
              Open Ticket Finder
            </button>
            <a
              className="rounded-full border-2 border-cyan-100 bg-white px-10 py-4 font-bold text-slate-600 shadow-sm transition hover:bg-cyan-50 active:scale-95 text-center"
              href="/"
            >
              Back Home
            </a>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Load show details from mock database
  const showData = {
    ...(showDatabase[showNameParam] || showDatabase['Symphony of Lights']),
    name: showNameParam,
  };

  const previewPricePerTicket = getTicketTypePrice(ticketTypeParam);
  const previewTotalAmount = quantity * previewPricePerTicket;

  const updateQuantityParams = (nextQuantity) => {
    setSearchParams((prevParams) => {
      const nextParams = new URLSearchParams(prevParams);
      nextParams.set('quantity', String(nextQuantity));
      return nextParams;
    });
  };

  const decrementQuantity = () => {
    if (isBookingInProgress) return;
    setBookingError('');
    const nextVal = Math.max(1, quantity - 1);
    setQuantity(nextVal);
    updateQuantityParams(nextVal);
  };

  const incrementQuantity = () => {
    if (isBookingInProgress) return;
    setBookingError('');
    const nextVal = Math.min(showData.maxQuantity, quantity + 1);
    setQuantity(nextVal);
    updateQuantityParams(nextVal);
  };

  const handleConfirmBooking = async () => {
    if (isBookingInProgress) {
      return;
    }

    setBookingError('');
    setBookingStatusMessage('');

    const payload = {
      showId: showIdParam,
      scheduleId: scheduleIdParam,
      showName: showNameParam,
      showDate: dateParam,
      ticketType: ticketTypeParam,
      quantity,
    };
    const payloadError = validateBookingPayload(payload);
    if (payloadError) {
      setBookingError(payloadError);
      return;
    }

    if (import.meta.env.DEV) {
      console.debug('[booking] validated create payload', {
        showId: payload.showId,
        scheduleId: payload.scheduleId,
        showDate: payload.showDate,
        ticketType: payload.ticketType,
        quantity: payload.quantity,
      });
    }

    try {
      setSubmitState('creating');
      setBookingStatusMessage('Creating booking...');
      const result = await createBooking(payload);

      if (result?.bookingId) {
        navigate(`/bookings/${result.bookingId}/payment`);
        return;
      }

      throw new Error('Booking ID was not returned.');
    } catch (error) {
      setSubmitState('idle');
      setBookingStatusMessage('');
      setBookingError(getBookingErrorMessage(error));

      if (error?.response?.status === 401) {
        navigate('/login', { state: { from: location } });
      }
    }
  };

  return (
    <MainLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-cyan-400 py-14 text-white md:py-20">
        <div className="absolute left-[10%] top-10 h-16 w-16 rounded-full bg-white/15" />
        <div className="absolute bottom-12 right-[15%] h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-20 top-12 h-60 w-60 rounded-full bg-cyan-200/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-50 backdrop-blur">
            AquaPulse
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Create Booking</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-cyan-50/85">
            Secure your front-row seat to an aquatic masterpiece. Reserve your spot for an unforgettable experience.
          </p>
        </div>

        <svg className="absolute bottom-0 left-0 h-10 w-full text-cyan-50" preserveAspectRatio="none" viewBox="0 0 1200 120" aria-hidden="true">
          <path
            className="fill-current"
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50.31,34.54,121.57,56.09,190.72,64.31,235.15,69.59,279,64.29,321.39,56.44Z"
          />
        </svg>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <article className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_12px_32px_rgba(0,105,107,0.1)]">
              <div className="relative h-64 md:h-96">
                <img alt={showData.name} className="h-full w-full object-cover" src={showData.imageUrl} />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-cyan-700/90 px-3 py-1 text-sm font-bold text-white backdrop-blur-md">
                    {showData.category}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1 text-sm font-bold text-slate-950 backdrop-blur-md">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {showData.badge}
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-950">{showData.name}</h2>
                <p className="text-base leading-8 text-slate-600">{showData.description}</p>
              </div>
            </article>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-4 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 p-6">
                <div className="rounded-full bg-cyan-100 p-3 text-cyan-800">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Date & Time</p>
                  <p className="text-2xl font-black text-slate-950">{formatDateString(dateParam)}</p>
                  <p className="text-slate-600">{showData.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 p-6">
                <div className="rounded-full bg-cyan-100 p-3 text-cyan-800">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Venue</p>
                  <p className="text-2xl font-black text-slate-950">{showData.venue}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-700" />
                    <span className="text-sm font-bold text-cyan-700">Available Now</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_12px_32px_rgba(0,105,107,0.1)] md:p-8">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div>
                  <h2 className="mb-1 text-2xl font-black text-slate-950">{ticketTypeLabel}</h2>
                  <p className="text-slate-600">Preview only. The final amount is confirmed by AquaPulse after booking creation.</p>
                  <p className="mt-2 text-2xl font-black text-cyan-700">
                    {formatCurrency(previewPricePerTicket)} <span className="text-base font-normal text-slate-500">/ ticket</span>
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center rounded-full border-2 border-cyan-100 bg-cyan-50 p-2">
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-cyan-700 shadow-sm transition hover:bg-cyan-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={quantity === 1 || isBookingInProgress}
                      onClick={decrementQuantity}
                      type="button"
                      aria-label="Decrease quantity"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <span className="w-14 text-center text-2xl font-black text-slate-950">{quantity}</span>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-cyan-700 shadow-sm transition hover:bg-cyan-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={quantity === showData.maxQuantity || isBookingInProgress}
                      onClick={incrementQuantity}
                      type="button"
                      aria-label="Increase quantity"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  <p className="text-xs italic text-slate-500">Max {showData.maxQuantity} tickets per booking</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <section className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_12px_32px_rgba(0,105,107,0.1)] md:p-8">
                <div className="pointer-events-none absolute -right-8 -top-8 opacity-5">
                  <span className="material-symbols-outlined text-[140px] text-cyan-700">waves</span>
                </div>

                <h2 className="relative z-10 mb-6 text-2xl font-black text-slate-950">Booking Summary</h2>
                <div className="relative z-10 mb-8 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-950">{showData.name}</p>
                      <p className="text-sm text-slate-500">{formatDateString(dateParam)}, {showData.time.split(' ')[0]} {showData.time.split(' ')[1]}</p>
                    </div>
                    <p className="font-bold text-slate-950">{formatCurrency(previewPricePerTicket)}</p>
                  </div>
                  <div className="flex items-center justify-between border-y border-cyan-100 py-4">
                    <p className="text-slate-500">Quantity</p>
                    <p className="font-bold text-slate-950">{quantity}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-cyan-700">Total Amount</p>
                    <p className="text-2xl font-black text-cyan-700">{formatCurrency(previewTotalAmount)}</p>
                  </div>
                </div>

                <div className="relative z-10 mb-8 space-y-4">
                  <div className="flex gap-3 rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-800">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <p>Frontend pricing is an estimate only. Final booking price is calculated by AquaPulse on the server.</p>
                  </div>
                  <div className="flex items-center gap-2 px-1 text-sm text-slate-500">
                    <span className="material-symbols-outlined text-lg text-cyan-600">verified</span>
                    <p>Secure checkout powered by AquaPulse</p>
                  </div>
                </div>

                <div className="relative z-10 space-y-4">
                  {bookingError && (
                    <div
                      className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                      role="alert"
                    >
                      {bookingError}
                    </div>
                  )}
                  {bookingStatusMessage && (
                    <div
                      className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800"
                      role="status"
                    >
                      {bookingStatusMessage}
                    </div>
                  )}
                  <button
                    className="w-full rounded-full bg-cyan-700 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isBookingInProgress}
                    onClick={handleConfirmBooking}
                    type="button"
                  >
                    {submitState === 'creating' ? 'Creating booking...' : 'Confirm Booking'}
                  </button>
                  <button
                    className="w-full text-center text-sm font-bold text-cyan-700 underline-offset-4 hover:underline cursor-pointer"
                    onClick={() => window.dispatchEvent(new CustomEvent('aquapulse:open-ticket-drawer'))}
                    type="button"
                  >
                    Open Ticket Finder
                  </button>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>
    </MainLayout>
  );
}
