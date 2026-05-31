import { useState } from 'react';

import MainLayout from '../../shared/layouts/MainLayout.jsx';

const show = {
  name: 'Symphony of Lights',
  category: 'Water Show',
  badge: 'Popular',
  date: 'Oct 24, 2024',
  time: '08:00 PM - 09:30 PM',
  venue: 'Aqua Plaza',
  ticketType: 'General Admission',
  pricePerTicket: 45,
  maxQuantity: 10,
  description:
    'Witness the world\'s most advanced synchronized water performance. A breathtaking choreography of 50-foot water jets, 4K laser projections, and an orchestral soundtrack that will leave you spellbound.',
  imageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBQJ-Fo4HDO72JbLax0CiFqctWCGXvU4YEfKNT6BKoii53LhvXYm3tK9deyNpu3SQhQuDwXH4brHWFob4XTMXC0igb1FTIelijgurjSK40wqc_V-h4hB2iXApJSw4tuIL9RRKwcdhGhhcgV9V5pOtwPQGvlVc5CRVwmmWl5xWGLSkDEXdqrpRF327LZc7RzHHIIOK5u5seDmxx49urrFLxksqEEDJ5_xPJn8EULd2-53B3FmPiCpcXrt3oMMoWR8T3lZdXTQe3xXQ',
};

const mockUser = {
  name: 'Marina Blue Waters',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Ktsr2eh2zseRpqmcWc1jQ2IUGLAARYiIysbobKUntDOh1nfDEifzPo42cD1xCI3T5oWurk7H1oKkKP_l2LrvMSTbQqGTFw60SUPYoNNMIv3gfUV3GqpU11JvrHJJDZgeCC_B5r0q8iYCRft-Kxz2bcJz_sWISuXeYsix-dHPCFCu7EefAYCNtuwQt1sSeMzD1LYvsG6zg6WcWlfRAxuW6RJDQt2u2lZ8PPXPaVPdz65gIS2xSH4QbYVkuUlpX6vy3tt5-fusYw',
};

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

export default function CreateBookingPage() {
  const [quantity, setQuantity] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const totalAmount = quantity * show.pricePerTicket;

  const decrementQuantity = () => {
    setBookingError('');
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const incrementQuantity = () => {
    setBookingError('');
    setQuantity((currentQuantity) => Math.min(show.maxQuantity, currentQuantity + 1));
  };

  const handleConfirmBooking = () => {
    if (!show?.name || !show?.date || !show?.time) {
      setBookingError('Selected show and schedule are required.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > show.maxQuantity) {
      setBookingError(`Quantity must be a number from 1 to ${show.maxQuantity}.`);
      return;
    }

    setBookingError('Booking details are valid. Checkout will be connected in a later phase.');
  };

  return (
    <MainLayout navbarProps={{ isLoggedIn: true, user: mockUser }}>
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
                <img alt={show.name} className="h-full w-full object-cover" src={show.imageUrl} />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-cyan-700/90 px-3 py-1 text-sm font-bold text-white backdrop-blur-md">
                    {show.category}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1 text-sm font-bold text-slate-950 backdrop-blur-md">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {show.badge}
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-950">{show.name}</h2>
                <p className="text-base leading-8 text-slate-600">{show.description}</p>
              </div>
            </article>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-4 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 p-6">
                <div className="rounded-full bg-cyan-100 p-3 text-cyan-800">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Date & Time</p>
                  <p className="text-2xl font-black text-slate-950">{show.date}</p>
                  <p className="text-slate-600">{show.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 p-6">
                <div className="rounded-full bg-cyan-100 p-3 text-cyan-800">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Venue</p>
                  <p className="text-2xl font-black text-slate-950">{show.venue}</p>
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
                  <h2 className="mb-1 text-2xl font-black text-slate-950">{show.ticketType}</h2>
                  <p className="text-slate-600">Includes standard seating and digital show guide.</p>
                  <p className="mt-2 text-2xl font-black text-cyan-700">
                    {formatCurrency(show.pricePerTicket)} <span className="text-base font-normal text-slate-500">/ ticket</span>
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center rounded-full border-2 border-cyan-100 bg-cyan-50 p-2">
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-cyan-700 shadow-sm transition hover:bg-cyan-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={quantity === 1}
                      onClick={decrementQuantity}
                      type="button"
                      aria-label="Decrease quantity"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <span className="w-14 text-center text-2xl font-black text-slate-950">{quantity}</span>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-cyan-700 shadow-sm transition hover:bg-cyan-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={quantity === show.maxQuantity}
                      onClick={incrementQuantity}
                      type="button"
                      aria-label="Increase quantity"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  <p className="text-xs italic text-slate-500">Max {show.maxQuantity} tickets per booking</p>
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
                      <p className="font-bold text-slate-950">{show.name}</p>
                      <p className="text-sm text-slate-500">Oct 24, 08:00 PM</p>
                    </div>
                    <p className="font-bold text-slate-950">{formatCurrency(show.pricePerTicket)}</p>
                  </div>
                  <div className="flex items-center justify-between border-y border-cyan-100 py-4">
                    <p className="text-slate-500">Quantity</p>
                    <p className="font-bold text-slate-950">{quantity}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-cyan-700">Total Amount</p>
                    <p className="text-2xl font-black text-cyan-700">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>

                <div className="relative z-10 mb-8 space-y-4">
                  <div className="flex gap-3 rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-800">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <p>Tickets are held for 15 minutes until checkout is confirmed.</p>
                  </div>
                  <div className="flex items-center gap-2 px-1 text-sm text-slate-500">
                    <span className="material-symbols-outlined text-lg text-cyan-600">verified</span>
                    <p>Secure checkout powered by AquaPulse</p>
                  </div>
                </div>

                <div className="relative z-10 space-y-4">
                  {bookingError && (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        bookingError.includes('valid')
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                          : 'border-red-100 bg-red-50 text-red-700'
                      }`}
                      role={bookingError.includes('valid') ? 'status' : 'alert'}
                    >
                      {bookingError}
                    </div>
                  )}
                  <button
                    className="w-full rounded-full bg-cyan-700 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:bg-cyan-800"
                    onClick={handleConfirmBooking}
                    type="button"
                  >
                    Confirm Booking
                  </button>
                  <a className="block text-center text-sm font-bold text-cyan-700 underline-offset-4 hover:underline" href="#">
                    Back to Schedules
                  </a>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>
    </MainLayout>
  );
}
