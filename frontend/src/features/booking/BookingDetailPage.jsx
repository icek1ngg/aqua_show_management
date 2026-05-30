import MainLayout from '../../shared/layouts/MainLayout.jsx';

const mockUser = {
  name: 'Marina Blue Waters',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Ktsr2eh2zseRpqmcWc1jQ2IUGLAARYiIysbobKUntDOh1nfDEifzPo42cD1xCI3T5oWurk7H1oKkKP_l2LrvMSTbQqGTFw60SUPYoNNMIv3gfUV3GqpU11JvrHJJDZgeCC_B5r0q8iYCRft-Kxz2bcJz_sWISuXeYsix-dHPCFCu7EefAYCNtuwQt1sSeMzD1LYvsG6zg6WcWlfRAxuW6RJDQt2u2lZ8PPXPaVPdz65gIS2xSH4QbYVkuUlpX6vy3tt5-fusYw',
};

const mockShow = {
  title: 'Midnight Aqua Symphony',
  category: 'Water Show',
  duration: '45 Minutes',
  price: '$39.00',
  venue: 'Main Plaza Pool',
  date: 'Oct 24, 2024',
  time: '8:00 PM - 8:45 PM',
  description:
    'A breathtaking fusion of choreographed fountains, lasers, and cinematic music. Experience the magic of liquid art under the moonlight.',
  imageUrl:
    'https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA',
};

const mockBooking = {
  reference: 'AQ-882190',
  placedAt: 'Oct 20, 2024',
  placedTime: '10:30 AM',
  status: 'PAID',
  tickets: '4 Adult Tickets',
  subtotal: '$156.00',
  processingFee: 'FREE',
  totalLabel: 'Total Paid',
  total: '$156.00',
};

const mockPayment = {
  status: 'SUCCESS',
  method: 'Credit / Debit Card',
  gateway: 'PayOS',
  transactionId: 'TRX-771290-ASMS',
};

const bookingStatusMeta = {
  PENDING_PAYMENT: {
    label: 'PENDING_PAYMENT',
    icon: 'hourglass_empty',
    badgeClassName: 'border-yellow-200 bg-yellow-100 text-[#a43c12]',
    alertClassName: 'border-yellow-200 bg-yellow-50 text-[#a43c12]',
    message:
      'Your reservation is being held while payment is pending. Continue checkout before the payment window closes.',
  },
  PAID: {
    label: 'PAID',
    icon: 'verified',
    badgeClassName: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    alertClassName: 'border-cyan-100 bg-cyan-50 text-cyan-800',
    message:
      'Your reservation is confirmed. We look forward to seeing you at the show. Please arrive at least 15 minutes before the start time.',
  },
  EXPIRED: {
    label: 'EXPIRED',
    icon: 'timer_off',
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-600',
    alertClassName: 'border-slate-200 bg-slate-50 text-slate-600',
    message:
      'This booking hold has expired. Seats are no longer reserved, but you can create a new booking when you are ready.',
  },
  FAILED: {
    label: 'FAILED',
    icon: 'error',
    badgeClassName: 'border-red-200 bg-red-100 text-red-700',
    alertClassName: 'border-red-200 bg-red-50 text-red-700',
    message:
      'The payment attempt was not completed. Please try again or create a new booking if the show is still available.',
  },
};

const paymentStatusMeta = {
  PENDING: {
    label: 'PENDING',
    badgeClassName: 'border-yellow-200 bg-yellow-100 text-[#a43c12]',
  },
  SUCCESS: {
    label: 'SUCCESS',
    badgeClassName: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  },
  FAILED: {
    label: 'FAILED',
    badgeClassName: 'border-red-200 bg-red-100 text-red-700',
  },
  EXPIRED: {
    label: 'EXPIRED',
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-600',
  },
};

function StatusBadge({ meta }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-black tracking-wide ${meta.badgeClassName}`}>
      {meta.icon ? <span className="material-symbols-outlined mr-1 text-[16px]">{meta.icon}</span> : null}
      {meta.label}
    </span>
  );
}

function getTimelineSteps(bookingStatus, paymentStatus) {
  const paymentComplete = bookingStatus === 'PAID' && paymentStatus === 'SUCCESS';
  const paymentFailed = bookingStatus === 'FAILED' || paymentStatus === 'FAILED';
  const paymentExpired = bookingStatus === 'EXPIRED' || paymentStatus === 'EXPIRED';

  return [
    {
      label: 'Booking Created',
      time: 'Oct 20, 10:30 AM',
      icon: 'check',
      state: 'complete',
    },
    {
      label: 'Waiting for Payment',
      time: 'Oct 20, 10:32 AM',
      icon: 'schedule',
      state: 'complete',
    },
    {
      label: paymentComplete ? 'Payment Completed' : paymentFailed ? 'Payment Failed' : paymentExpired ? 'Payment Expired' : 'Payment Pending',
      time: paymentComplete ? 'Oct 20, 10:35 AM' : paymentFailed ? 'Action needed' : paymentExpired ? 'Window closed' : 'In progress',
      icon: paymentComplete ? 'payments' : paymentFailed ? 'error' : paymentExpired ? 'timer_off' : 'hourglass_empty',
      state: paymentComplete ? 'complete' : paymentFailed ? 'failed' : paymentExpired ? 'expired' : 'current',
    },
    {
      label: paymentComplete ? 'Booking Updated' : paymentFailed ? 'Review Required' : paymentExpired ? 'Hold Released' : 'Awaiting Update',
      time: paymentComplete ? 'Available Now' : paymentFailed ? 'Pending action' : paymentExpired ? 'No longer held' : 'After payment',
      icon: paymentComplete ? 'event_available' : paymentFailed ? 'priority_high' : paymentExpired ? 'event_busy' : 'pending',
      state: paymentComplete ? 'completeSoft' : paymentFailed ? 'failedSoft' : paymentExpired ? 'expiredSoft' : 'waiting',
    },
  ];
}

function getStepClassName(state) {
  const classes = {
    complete: 'bg-cyan-700 text-white shadow-lg shadow-cyan-700/20',
    completeSoft: 'bg-cyan-100 text-cyan-800',
    current: 'bg-yellow-100 text-[#a43c12] shadow-lg shadow-yellow-200/50',
    waiting: 'bg-slate-100 text-slate-400',
    failed: 'bg-red-600 text-white shadow-lg shadow-red-600/20',
    failedSoft: 'bg-red-100 text-red-700',
    expired: 'bg-slate-500 text-white',
    expiredSoft: 'bg-slate-100 text-slate-500',
  };

  return classes[state] || classes.waiting;
}

function BookingActions({ status }) {
  const handleMockAction = () => {};

  if (status === 'PENDING_PAYMENT') {
    return (
      <>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 active:scale-[0.98]"
          onClick={handleMockAction}
          type="button"
        >
          <span className="material-symbols-outlined text-xl">payments</span>
          Continue Payment
        </button>
        <a
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-6 py-4 font-bold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50 active:scale-[0.98]"
          href="/bookings/my"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Back to My Bookings
        </a>
      </>
    );
  }

  if (status === 'EXPIRED') {
    return (
      <>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 active:scale-[0.98]"
          onClick={handleMockAction}
          type="button"
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
          Book Again
        </button>
        <a
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-6 py-4 font-bold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50 active:scale-[0.98]"
          href="/bookings/my"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Back to My Bookings
        </a>
      </>
    );
  }

  if (status === 'FAILED') {
    return (
      <>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-4 font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 active:scale-[0.98]"
          onClick={handleMockAction}
          type="button"
        >
          <span className="material-symbols-outlined text-xl">replay</span>
          Try Again
        </button>
        <a
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-6 py-4 font-bold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50 active:scale-[0.98]"
          href="/bookings/my"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Back to My Bookings
        </a>
      </>
    );
  }

  return (
    <>
      <a
        className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 active:scale-[0.98]"
        href="/bookings/my"
      >
        <span className="material-symbols-outlined text-xl">arrow_back</span>
        Back to My Bookings
      </a>
      <button
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-6 py-4 font-bold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50 active:scale-[0.98]"
        onClick={handleMockAction}
        type="button"
      >
        <span className="material-symbols-outlined text-xl">explore</span>
        Explore More Shows
      </button>
    </>
  );
}

export default function BookingDetailPage() {
  const bookingMeta = bookingStatusMeta[mockBooking.status];
  const paymentMeta = paymentStatusMeta[mockPayment.status];
  const timelineSteps = getTimelineSteps(mockBooking.status, mockPayment.status);

  return (
    <MainLayout navbarProps={{ isLoggedIn: true, user: mockUser }}>
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
      </section>

      <section className="bg-gradient-to-b from-white via-cyan-50/40 to-white px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)] md:p-8">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Booking Reference</span>
                  <h2 className="mt-2 text-3xl font-black text-slate-900">#{mockBooking.reference}</h2>
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    Placed on {mockBooking.placedAt} at {mockBooking.placedTime}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 md:justify-end">
                  <StatusBadge meta={bookingMeta} />
                  <StatusBadge meta={paymentMeta} />
                </div>
              </div>

              <div className={`mt-8 flex items-start gap-4 rounded-3xl border p-5 ${bookingMeta.alertClassName}`}>
                <span className="material-symbols-outlined mt-0.5">{bookingMeta.icon}</span>
                <p className="text-sm font-semibold leading-7">{bookingMeta.message}</p>
              </div>
            </article>

            <article className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
              <div className="group relative aspect-video overflow-hidden lg:h-80">
                <img
                  alt={mockShow.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  src={mockShow.imageUrl}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <span className="absolute bottom-6 left-6 rounded-2xl bg-[#ff6900] px-5 py-2 text-2xl font-black text-white shadow-xl">
                  {mockShow.price}
                </span>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-black text-cyan-800">{mockShow.category}</span>
                  <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black text-slate-600">{mockShow.duration}</span>
                </div>

                <h3 className="mt-5 text-3xl font-black text-slate-950">{mockShow.title}</h3>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{mockShow.description}</p>

                <div className="mt-8 grid grid-cols-1 gap-5 border-t border-cyan-100 pt-8 md:grid-cols-2">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Venue</span>
                      <span className="mt-1 block text-lg font-black text-slate-900">{mockShow.venue}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Schedule</span>
                      <span className="mt-1 block text-lg font-black text-slate-900">{mockShow.date}</span>
                      <span className="mt-0.5 block text-sm font-semibold text-slate-500">{mockShow.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)] md:p-8">
              <h4 className="text-2xl font-black text-slate-950">Booking Journey</h4>

              <div className="relative mt-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="absolute left-6 top-6 hidden h-0.5 bg-cyan-100 md:left-[8%] md:right-[8%] md:block" />

                {timelineSteps.map((step) => (
                  <div className="relative z-10 flex w-full items-center gap-4 md:w-1/4 md:flex-col md:text-center" key={step.label}>
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white ${getStepClassName(step.state)}`}
                    >
                      <span className="material-symbols-outlined text-xl">{step.icon}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-black text-slate-900">{step.label}</span>
                      <span className="mt-1 block text-[11px] font-bold text-slate-400">{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
            <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
              <h4 className="text-2xl font-black text-slate-950">Order Summary</h4>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-600">{mockBooking.tickets}</span>
                  <span className="font-black text-slate-950">{mockBooking.subtotal}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800">{mockBooking.subtotal}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">Processing Fee</span>
                  <span className="font-black text-cyan-700">{mockBooking.processingFee}</span>
                </div>
                <div className="mt-6 border-t border-cyan-100 pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{mockBooking.totalLabel}</span>
                    <span className="text-3xl font-black text-cyan-700">{mockBooking.total}</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
              <h4 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Payment Information</h4>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-500">Method</span>
                  <span className="text-xs font-black text-slate-900">{mockPayment.method}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-500">Gateway</span>
                  <span className="rounded-md bg-cyan-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-cyan-800">
                    {mockPayment.gateway}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-dashed border-cyan-100 pt-4">
                  <span className="text-xs font-semibold text-slate-500">Transaction ID</span>
                  <span className="text-xs font-semibold text-slate-500">{mockPayment.transactionId}</span>
                </div>
              </div>
            </article>

            <div className="flex flex-col gap-3">
              <BookingActions status={mockBooking.status} />
            </div>
          </aside>
        </div>
      </section>
    </MainLayout>
  );
}
