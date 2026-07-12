import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { buildBookingUrl } from '../services/bookingService.js';
import { getShowDetail, getShowSchedules } from '../services/showService.js';
import MainLayout from '../shared/layouts/MainLayout.jsx';
import { formatCurrency } from '../shared/utils/ticketPricing.js';

const fallbackImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAFeYRb8WkcNVQn2b1wxiXnDpTIB3-X8eybricRUgfMxWVfemwimDD2m_G_GiZUhW_oUx8L2aM98YoUGaHihmAaEQqP0rm5iBI3SgODMA9PSd0NfnZtfx2VUcNOrSewM73gS500HW-XbrSUG3zdcNdC8So1mOYMSf6xlwzSi_2NT6bph-dzQzqAEnmZZpyFgL9wvluMYa1G1kdZYz21Dkj9Bo62tfTY4Is8GpWRAQkP_Snkfi9PJX5FN0eml38fvqfFWooX13Cp5nq7',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBO-bCRxh2UwsQxWXeJUJQuejBAWT31c892YxMXztuGu0Qiet3S5wmaOfgfsTn_SUPEWKv1X6fk9ozFjATdo_XwJcKrUzd71xcZ23D4tZ6ZfLoCndPt_59a3YYz2GVMhx8HcTh4y1COQv2ckVTX-Ev3Z51bAF_Wt_3tcuciZ2ncN6t3rYm5JSzfG1n1igwxynE0qtDFsI-0VUrQxpgdC8ljcDDjgcU38xlZM1Q9kwJP4n6qCjB5ol5BT-Giw4ZnuRXZsEhTZHuJwkHO',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDKH4HodTfmDcO_ukYHvV3We2Q-2-5SLttCRwvL1CHxFklUt2phbyk4eI8rW-F9i9D6p6tO5PjQ76MSUDCwcyfMf9Y6EZIBLp5rA8zMy0vK2w3KHTDrxtu1aYv0iekjR0uol3OLMKn4v8zbnacHaaDt2J2KTkhRPYEvP5a303MDwaudUvNvhiBGtqL7QTtl3PgB5MzXTvsxKVFzspE7KOCOXvzvvoXkIkME5dBTAIIAIJUl7kIhTuJ_GVGs5HlpAx8Mr6LdkF1vpBxz',
];

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBA';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTimeRange(startValue, endValue) {
  const options = { hour: '2-digit', minute: '2-digit', hour12: false };
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Time TBA';
  return `${start.toLocaleTimeString('en-US', options)} — ${end.toLocaleTimeString('en-US', options)}`;
}

function getErrorState(error) {
  if ([400, 404].includes(error?.response?.status)) {
    return { title: 'Show not found', message: 'This show is unavailable or the link is invalid.', icon: 'search_off' };
  }
  return {
    title: 'Could not load show',
    message: error?.response?.data?.message || error?.message || 'Please try again in a moment.',
    icon: 'error',
  };
}

function availabilityFor(schedule) {
  const available = Number(schedule.availableTickets);
  const start = new Date(schedule.startTime);
  if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now() + 30 * 60 * 1000) {
    return { unavailable: true, label: 'Booking closed', button: 'CLOSED' };
  }
  if (Number.isFinite(available) && available <= 0) {
    return { unavailable: true, label: 'SOLD OUT', button: 'SOLD OUT' };
  }
  return { unavailable: false, label: Number.isFinite(available) ? `${available} Tickets Left` : 'Availability TBA', button: 'SELECT' };
}

function LoadingDetail() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-container-max px-4 py-16">
        <div className="h-[500px] animate-pulse rounded-2xl bg-cyan-100" />
        <div className="mt-8 h-48 animate-pulse rounded-2xl bg-white" />
      </div>
    </MainLayout>
  );
}

function StateMessage({ state, onRetry }) {
  return (
    <MainLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-xl rounded-2xl bg-white p-10 text-center shadow-xl">
          <span className="material-symbols-outlined text-6xl text-primary">{state.icon}</span>
          <h1 className="mt-4 text-2xl font-extrabold">{state.title}</h1>
          <p className="mt-3 text-on-surface-variant">{state.message}</p>
          <div className="mt-7 flex justify-center gap-3">
            {onRetry && <button className="rounded-full bg-primary px-6 py-3 font-bold text-white" onClick={onRetry} type="button">Try again</button>}
            <Link className="rounded-full border border-outline-variant px-6 py-3 font-bold text-primary" to="/shows">Back to shows</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ShowDetailPage() {
  const { showId } = useParams();
  const [show, setShow] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [quantity, setQuantity] = useState(2);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    Promise.all([getShowDetail(showId), getShowSchedules(showId)])
      .then(([detail, list]) => {
        if (!active) return;
        setShow(detail);
        setSchedules(Array.isArray(list) ? list : detail?.schedules || []);
      })
      .catch((error) => {
        if (!active) return;
        setShow(null);
        setSchedules([]);
        setLoadError(getErrorState(error));
      })
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [reloadKey, showId]);

  const heroImages = useMemo(() => [...new Set([show?.imageUrl, ...fallbackImages].filter(Boolean))].slice(0, 3), [show?.imageUrl]);

  useEffect(() => {
    if (heroImages.length < 2) return undefined;
    const timer = window.setInterval(() => setCurrentSlide((slide) => (slide + 1) % heroImages.length), 5000);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  const effectiveDate = selectedDate || localDateKey();
  const filteredSchedules = useMemo(
    () => schedules
      .filter((schedule) => localDateKey(schedule.startTime) === effectiveDate)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [effectiveDate, schedules],
  );

  const selectedSchedule = schedules.find((schedule) => String(schedule.id) === String(selectedScheduleId)) || null;
  const unitPrice = Number(selectedSchedule?.price) || 0;
  const bookingUrl = selectedSchedule && show
    ? buildBookingUrl({
      showId: show.id,
      scheduleId: selectedSchedule.id,
      showName: show.title,
      showDate: localDateKey(selectedSchedule.startTime),
      quantity,
      ticketType: 'STANDARD',
    })
    : null;

  if (isLoading) return <LoadingDetail />;
  if (loadError) return <StateMessage state={loadError} onRetry={loadError.icon === 'error' ? () => setReloadKey((key) => key + 1) : null} />;
  if (!show) return <StateMessage state={{ title: 'Show not found', message: 'This show is unavailable.', icon: 'search_off' }} />;

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-on-surface selection:bg-primary-container/30">
        <style>{`
          .show-glass { background: rgba(255,255,255,.72); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,.5); }
          .show-hero-gradient { background: linear-gradient(180deg, rgba(0,105,107,.12), rgba(0,0,0,.74)); }
          .show-portal-glow { box-shadow: 0 0 30px rgba(0,206,209,.16); }
          .show-booking-action { background-color: #ff6b00 !important; color: #ffffff !important; }
          .show-booking-action:hover { background-color: #e85f00 !important; }
        `}</style>

        {lightboxOpen && (
          <div className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/95 p-6" onClick={() => setLightboxOpen(false)} role="presentation">
            <button aria-label="Close image" className="absolute right-6 top-6 text-white hover:text-primary-container" onClick={() => setLightboxOpen(false)} type="button">
              <span className="material-symbols-outlined text-4xl">close</span>
            </button>
            <img alt={show.title} className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" src={heroImages[currentSlide]} />
          </div>
        )}

        <section className="relative h-[65vh] min-h-[500px] w-full cursor-zoom-in overflow-hidden" onClick={() => setLightboxOpen(true)} role="presentation">
          {heroImages.map((image, index) => (
            <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`} key={image} style={{ backgroundImage: `url('${image}')` }} />
          ))}
          <div className="show-hero-gradient absolute inset-0" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 mx-auto max-w-container-max px-4 pb-16 sm:px-8 lg:px-margin-desktop">
            <div className="flex flex-col gap-4">
              <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/90">
                <Link className="pointer-events-auto hover:text-primary-container" onClick={(event) => event.stopPropagation()} to="/shows">Shows</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary-container">{show.title}</span>
              </nav>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-brand-orange px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">{show.status === 'ACTIVE' ? 'Active Now' : show.status || 'Active Now'}</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-white/90"><span className="material-symbols-outlined text-[18px]">schedule</span>{show.durationMinutes ? `${show.durationMinutes} Minutes` : 'Duration TBA'}</span>
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">{show.title}</h1>
            </div>
          </div>
          <div className="absolute bottom-8 right-6 z-10 flex gap-2 lg:right-margin-desktop">
            {heroImages.map((image, index) => <span className={`h-1 rounded-full transition-all ${index === currentSlide ? 'w-8 bg-white' : 'w-8 bg-white/40'}`} key={image} />)}
          </div>
        </section>

        <section className="mx-auto max-w-container-max px-4 py-8 sm:px-8 lg:px-margin-desktop">
          <div className="flex flex-col gap-10">
            <div className="show-glass show-portal-glow w-full rounded-2xl p-6 shadow-xl">
              <h2 className="mb-6 text-2xl font-extrabold text-primary">About the Show</h2>
              <p className="text-base font-medium leading-relaxed text-on-surface-variant">{show.description || 'More information about this show will be available soon.'}</p>
              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div><span className="block text-[10px] font-black uppercase tracking-widest text-outline">Category</span><span className="text-sm font-bold text-primary">Interactive Arts</span></div>
                <div><span className="block text-[10px] font-black uppercase tracking-widest text-outline">Show Type</span><span className="text-sm font-bold text-primary">4D Experience</span></div>
                <div><span className="block text-[10px] font-black uppercase tracking-widest text-outline">Audience</span><span className="text-sm font-bold text-primary">All Ages</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:gap-10">
                <div className="min-w-0 flex flex-col gap-8" id="upcoming-times">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-primary">Upcoming Times</h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-outline">{selectedDate ? formatDay(`${selectedDate}T00:00:00`) : `Today · ${formatDay(new Date())}`}</p>
                  </div>
                  <div className="relative">
                    <button className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-orange hover:underline" onClick={() => setCalendarOpen((open) => !open)} type="button">
                      View Calendar <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    </button>
                    {calendarOpen && (
                      <div className="absolute right-0 top-8 z-20 w-72 rounded-2xl border border-outline-variant/40 bg-white p-4 shadow-xl">
                        <label className="text-[10px] font-black uppercase tracking-widest text-outline" htmlFor="show-date">Choose a date</label>
                        <input className="mt-2 w-full rounded-xl border-outline-variant text-primary focus:border-primary focus:ring-primary" id="show-date" min={localDateKey()} onChange={(event) => { setSelectedDate(event.target.value); setSelectedScheduleId(''); setCalendarOpen(false); }} type="date" value={selectedDate} />
                        {selectedDate && <button className="mt-3 text-xs font-bold text-brand-orange hover:underline" onClick={() => { setSelectedDate(''); setSelectedScheduleId(''); setCalendarOpen(false); }} type="button">Back to today</button>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {filteredSchedules.length === 0 ? (
                    <div className="show-glass rounded-2xl p-10 text-center shadow-md">
                      <span className="material-symbols-outlined text-5xl text-primary">event_busy</span>
                      <h3 className="mt-3 text-xl font-extrabold text-on-surface">No showtimes on this date</h3>
                      <p className="mt-2 text-sm text-on-surface-variant">Open the calendar to choose another date.</p>
                    </div>
                  ) : filteredSchedules.map((schedule) => {
                    const availability = availabilityFor(schedule);
                    const selected = String(schedule.id) === String(selectedScheduleId);
                    return (
                      <article className={`show-glass relative overflow-hidden rounded-2xl border p-6 shadow-md transition-all ${selected ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-transparent'} ${availability.unavailable ? 'opacity-60 grayscale-[.5]' : 'hover:shadow-xl'}`} key={schedule.id}>
                        <div className="mb-6 flex items-start justify-between gap-4">
                          <div>
                            <span className={`block text-2xl font-black ${availability.unavailable ? 'text-outline' : 'text-primary'}`}>{formatTimeRange(schedule.startTime, schedule.endTime)}</span>
                            <span className="mt-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant"><span className="material-symbols-outlined text-[16px] text-brand-orange">location_on</span>{schedule.venueName || 'Venue TBA'}</span>
                          </div>
                          <div className="text-right"><span className="text-2xl font-black text-on-surface">{formatCurrency(schedule.price)}</span><span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-outline">per ticket</span></div>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-outline-variant/30 pt-6">
                          <div><span className="block text-[10px] font-black uppercase tracking-widest text-outline">Availability</span><span className={`block text-sm font-bold ${availability.unavailable ? 'text-error' : 'text-primary'}`}>{availability.label}</span></div>
                          <button className={`rounded-full px-10 py-3 text-sm font-black transition-all ${availability.unavailable ? 'cursor-not-allowed bg-outline-variant text-on-surface-variant' : 'show-booking-action shadow-lg shadow-brand-orange/20 hover:scale-105 active:scale-95'}`} disabled={availability.unavailable} onClick={() => { setSelectedScheduleId(schedule.id); setQuantity(2); }} type="button">{selected ? 'SELECTED' : availability.button}</button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="flex gap-4 rounded-2xl border border-primary/10 bg-primary/5 p-6">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  <div><span className="text-sm font-bold uppercase tracking-widest text-primary">Visitor Advisory</span><p className="mt-1 text-xs font-medium leading-relaxed text-on-surface-variant">Please arrive 20 minutes before showtime. This performance may feature strobe lights and loud audio effects.</p></div>
                </div>
              </div>

              <aside className="min-w-0 md:sticky md:top-24">
                <div className="show-glass rounded-2xl border border-primary/20 p-6 shadow-xl">
                  <h3 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-primary"><span className="material-symbols-outlined">shopping_basket</span>Booking Summary</h3>
                  <div className="flex flex-col gap-6">
                    <div><span className="block text-[10px] font-black uppercase tracking-widest text-outline">Selected Show</span><span className="text-base font-bold text-on-surface">{show.title}</span></div>
                    <div><span className="block text-[10px] font-black uppercase tracking-widest text-outline">Selected Time</span><span className="text-sm font-bold text-on-surface">{selectedSchedule ? `${formatDay(selectedSchedule.startTime)} · ${formatTimeRange(selectedSchedule.startTime, selectedSchedule.endTime)}` : 'Choose a showtime'}</span></div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-outline">Selected Tickets</span>
                      <div className="mt-1 flex items-center justify-between gap-2"><span className="text-sm font-bold">{quantity} Standard {quantity === 1 ? 'Ticket' : 'Tickets'}</span><div className="flex items-center gap-2"><button aria-label="Decrease tickets" className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant hover:bg-secondary-container disabled:opacity-40" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} type="button"><span className="material-symbols-outlined text-sm">remove</span></button><span className="min-w-4 text-center text-sm font-bold">{quantity}</span><button aria-label="Increase tickets" className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant hover:bg-secondary-container disabled:opacity-40" disabled={quantity >= Math.min(10, Number(selectedSchedule?.availableTickets) || 10)} onClick={() => setQuantity((value) => Math.min(10, value + 1))} type="button"><span className="material-symbols-outlined text-sm">add</span></button></div></div>
                    </div>
                    <div className="flex items-center justify-between border-t border-outline-variant/30 pt-6"><span className="text-[10px] font-black uppercase tracking-widest text-outline">Total Price</span><span className="text-2xl font-black text-primary">{formatCurrency(unitPrice * quantity)}</span></div>
                    {bookingUrl ? <Link className="show-booking-action flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-black shadow-lg shadow-brand-orange/30 transition-all hover:-translate-y-1 hover:shadow-brand-orange/50" to={bookingUrl}>PROCEED TO BOOKING<span className="material-symbols-outlined text-[20px]">arrow_forward</span></Link> : <button className="w-full cursor-not-allowed rounded-full bg-outline-variant py-4 text-sm font-black text-on-surface-variant" disabled type="button">SELECT A SHOWTIME</button>}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
