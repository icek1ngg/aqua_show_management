import { useEffect, useState } from 'react';

import MainLayout from '../../shared/layouts/MainLayout.jsx';

const initialCountdownSeconds = 13 * 60 + 21;

const mockBooking = {
  id: 'AQ-882190',
  showName: 'Symphony of Lights',
  dateTime: 'Oct 24, 2024 - 08:30 PM',
  venue: 'Aqua Plaza',
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

export default function BookingPendingPage() {
  const [countdownSeconds, setCountdownSeconds] = useState(initialCountdownSeconds);
  const isExpired = countdownSeconds === 0;
  const status = isExpired ? 'EXPIRED' : 'PENDING_PAYMENT';

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

  return (
    <MainLayout navbarProps={{ isLoggedIn: true, user: mockUser }}>
      <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-gradient-to-b from-cyan-50 via-white to-cyan-100 py-12 md:py-20">
        <div className="absolute left-[10%] top-20 h-20 w-20 rounded-full bg-cyan-300/20" />
        <div className="absolute right-[15%] top-60 h-32 w-32 rounded-full bg-teal-300/20" />
        <div className="absolute bottom-40 left-[20%] h-16 w-16 rounded-full bg-cyan-400/20" />
        <div className="absolute -right-20 bottom-24 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
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
                  : `We created your reservation for ${mockBooking.showName}. To guarantee your seats, please continue before the timer expires.`}
              </p>
            </div>

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
                href="/bookings/1"
              >
                View Booking Detail
              </a>
            </div>

            <a className="hidden items-center gap-2 font-bold text-cyan-700 underline-offset-4 hover:underline lg:inline-flex" href="#">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Home
            </a>
          </section>

          <aside className="lg:col-span-5">
            <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_48px_rgba(0,0,0,0.05)]">
              <div className="relative h-48 overflow-hidden">
                <img alt={mockBooking.showName} className="h-full w-full object-cover transition duration-700 hover:scale-110" src={mockBooking.imageUrl} />
                <div className="absolute right-4 top-4 rounded-full bg-yellow-200 px-3 py-1 text-xs font-black text-slate-900">
                  {mockBooking.totalAmount}
                </div>
              </div>

              <div className="space-y-6 p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-cyan-700">Booking Summary</h2>
                    <p className="text-sm font-bold text-slate-500">Order #{mockBooking.id}</p>
                  </div>
                  <span className="material-symbols-outlined text-4xl text-cyan-200">confirmation_number</span>
                </div>

                <div className="space-y-4 border-t border-cyan-100 pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Show Name</span>
                    <span className="font-bold text-slate-900">{mockBooking.showName}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Date & Time</span>
                    <span className="text-right font-bold text-slate-900">{mockBooking.dateTime}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Venue</span>
                    <span className="font-bold text-slate-900">{mockBooking.venue}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Quantity</span>
                    <span className="font-bold text-slate-900">{mockBooking.quantity}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t-2 border-dashed border-cyan-100 pt-6">
                  <span className="text-xl font-black text-slate-950">Total Amount</span>
                  <span className="text-3xl font-black text-cyan-700">{mockBooking.totalAmount}</span>
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
              <a className="w-full rounded-full border-2 border-cyan-700 bg-white py-4 text-center font-bold text-cyan-700" href="/bookings/1">
                View Booking Detail
              </a>
              <a className="py-2 text-center font-bold text-cyan-700" href="#">
                Back to Home
              </a>
            </div>
          </aside>
        </div>

        <div className="absolute bottom-0 left-0 w-full rotate-180 leading-[0]">
          <svg className="h-auto w-full fill-cyan-50" viewBox="0 0 1440 320" aria-hidden="true">
            <path d="M0,160L48,176C96,192,192,224,288,229.3C384,235,480,213,576,181.3C672,149,768,107,864,112C960,117,1056,171,1152,181.3C1248,192,1344,160,1392,144L1440,128L1440,320H0Z" />
          </svg>
        </div>
      </main>
    </MainLayout>
  );
}
