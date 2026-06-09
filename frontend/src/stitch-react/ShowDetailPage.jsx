import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { buildBookingUrl } from '../services/bookingService.js';
import { getShowDetail, getShowSchedules } from '../services/showService.js';
import MainLayout from '../shared/layouts/MainLayout.jsx';

const fallbackShowImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANv7I9nTUaKmdiA6IfaIaY0YwJUIWoqM0X6m_tgMmcJ71PacmGbCJL7U7jN8rhBXSUuV7fovx9LDsAc6N5PhTyiCp6LssLe6FgDdZmMcwFIlWNhrmPMXPWNaNGaENraIJuHz9U8O5qXFdHXwD12d0tWFF6pkX61XHVJWiPscKVSeVXPJHPLntIinpKKiq48E_jrrE2A6BF6g5CVGhbzwWhTMCs07mHdwovKDWCZJwE9QP5SidUIrVjslByRhoxaZve3By201M-MkjJ';

function getErrorState(error) {
  const status = error?.response?.status;

  if (status === 404 || status === 400) {
    return {
      title: 'Show not found',
      message: 'This show is unavailable or the link is not a valid show ID.',
      type: 'not-found',
    };
  }

  return {
    title: 'Could not load show',
    message: error?.response?.data?.message || error?.message || 'Please try again in a moment.',
    type: 'error',
  };
}

function formatDateTime(value) {
  if (!value) {
    return 'TBA';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'TBA';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeRange(startTime, endTime) {
  const start = startTime ? new Date(startTime) : null;
  const end = endTime ? new Date(endTime) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Time TBA';
  }

  return `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'Price TBA';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function dateParam(value) {
  if (!value) {
    return '';
  }

  const datePart = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return '';
  }

  return datePart;
}

function bookingUrl(show, schedule) {
  return buildBookingUrl({
    showId: show.id,
    scheduleId: schedule.id,
    showName: show.title,
    showDate: dateParam(schedule.startTime),
    quantity: '1',
    ticketType: 'Standard Entry',
  });
}

function scheduleAvailability(schedule) {
  const availableTickets = Number(schedule.availableTickets);
  const startTime = schedule.startTime ? new Date(schedule.startTime) : null;

  if (!startTime || Number.isNaN(startTime.getTime()) || startTime.getTime() <= Date.now() + 30 * 60 * 1000) {
    return {
      label: 'Booking closed',
      isUnavailable: true,
      buttonLabel: 'Booking Closed',
      className: 'text-on-surface-variant font-semibold',
    };
  }

  if (!Number.isFinite(availableTickets)) {
    return {
      label: 'Availability TBA',
      isUnavailable: false,
      buttonLabel: 'Book Now',
      className: 'text-on-surface-variant',
    };
  }

  if (availableTickets <= 0) {
    return {
      label: 'Sold out',
      isUnavailable: true,
      buttonLabel: 'Sold Out',
      className: 'text-error font-bold italic',
    };
  }

  return {
    label: `${availableTickets} tickets left`,
    isUnavailable: false,
    buttonLabel: 'Book Now',
    className: 'text-secondary font-semibold',
  };
}

function LoadingDetail() {
  return (
    <MainLayout>
      <div className="bg-background px-4 py-24 text-on-background sm:px-6 lg:px-8">
        <div className="mx-auto max-w-container-max">
          <div className="h-[420px] animate-pulse rounded-xl bg-cyan-100/60" />
          <div className="mt-10 grid grid-cols-1 gap-gutter lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="glass-panel rounded-xl p-unit-lg shadow-sm">
                <div className="h-8 w-1/3 animate-pulse rounded-full bg-cyan-100" />
                <div className="mt-6 space-y-3">
                  <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
            <div className="space-y-4 lg:col-span-5">
              <div className="h-28 animate-pulse rounded-xl bg-white" />
              <div className="h-28 animate-pulse rounded-xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function StateMessage({ title, message, icon = 'error', action }) {
  return (
    <MainLayout>
      <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-20 text-on-background">
        <div className="max-w-xl rounded-xl border border-outline-variant/30 bg-white p-10 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-primary">{icon}</span>
          <h1 className="mt-4 font-headline-md text-headline-md text-on-surface">{title}</h1>
          <p className="mt-3 text-body-md text-on-surface-variant">{message}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {action}
            <Link className="rounded-full border border-outline-variant px-6 py-3 font-button text-button text-primary transition hover:bg-primary/5" to="/shows">
              Back to shows
            </Link>
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

  useEffect(() => {
    let isActive = true;

    async function loadShow() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [detail, scheduleList] = await Promise.all([
          getShowDetail(showId),
          getShowSchedules(showId),
        ]);

        if (!isActive) {
          return;
        }

        setShow(detail);
        setSchedules(Array.isArray(scheduleList) ? scheduleList : detail?.schedules || []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setShow(null);
        setSchedules([]);
        setLoadError(getErrorState(error));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadShow();

    return () => {
      isActive = false;
    };
  }, [reloadKey, showId]);

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort((first, second) => {
        const firstTime = new Date(first.startTime || 0).getTime();
        const secondTime = new Date(second.startTime || 0).getTime();
        return firstTime - secondTime;
      }),
    [schedules],
  );

  if (isLoading) {
    return <LoadingDetail />;
  }

  if (loadError) {
    return (
      <StateMessage
        title={loadError.title}
        message={loadError.message}
        icon={loadError.type === 'not-found' ? 'search_off' : 'error'}
        action={
          loadError.type === 'error' ? (
            <button className="rounded-full bg-primary px-6 py-3 font-button text-button text-on-primary transition hover:opacity-90" type="button" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          ) : null
        }
      />
    );
  }

  if (!show) {
    return <StateMessage title="Show not found" message="This show is unavailable." icon="search_off" />;
  }

  return (
    <MainLayout>
      <div className="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
        <style>{".glass-panel {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            -webkit-backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n        }\r\n        .material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n            vertical-align: middle;\r\n        }\r\n        .text-button { font-size: 14px; font-weight: 600; text-transform: none; }\r\n        .font-button { font-family: 'Plus Jakarta Sans', sans-serif; }\r\n        .text-label-bold { font-size: 12px; font-weight: 700; }\r\n        .font-label-bold { font-family: 'Plus Jakarta Sans', sans-serif; }\r\n        \r\n        .hero-gradient {\r\n            background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);\r\n        }"}</style>
        <main>
          <section className="relative h-[614px] min-h-[500px] w-full overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: `url('${show.imageUrl || fallbackShowImage}')` }}
            />
            <div className="hero-gradient absolute inset-0" />
            <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-container-max p-margin-desktop">
              <div className="mb-unit-lg flex flex-col gap-unit-sm">
                <nav className="mb-2 flex items-center gap-unit-sm text-label-md font-label-md text-white/80">
                  <Link className="transition-colors hover:text-electric-cyan" to="/shows">
                    Shows
                  </Link>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="text-white">{show.title}</span>
                </nav>
                <div className="flex flex-wrap items-center gap-unit-md">
                  {show.status && (
                    <span className="rounded-full bg-primary-container px-3 py-1 text-label-md font-label-bold uppercase tracking-wider text-on-primary-container">
                      {show.status}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-label-md font-label-md text-white/90">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    {show.durationMinutes ? `${show.durationMinutes} mins` : 'Duration TBA'}
                  </div>
                </div>
                <h1 className="max-w-4xl text-headline-2xl font-headline-2xl leading-tight text-white md:text-[64px]">{show.title}</h1>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-container-max px-margin-desktop py-unit-xl">
            <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
              <div className="flex flex-col gap-unit-xl lg:col-span-7">
                <div className="glass-panel rounded-xl p-unit-lg shadow-sm">
                  <h2 className="mb-unit-md font-headline-md text-headline-md text-primary">About the Show</h2>
                  <p className="text-body-lg font-body-lg leading-relaxed text-on-surface-variant">
                    {show.description || 'More information about this show will be available soon.'}
                  </p>
                  <div className="mt-unit-xl grid grid-cols-2 gap-unit-md sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-label-md font-label-md text-outline">Status</span>
                      <span className="font-body-md font-semibold text-on-surface">{show.status || 'TBA'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-label-md font-label-md text-outline">Duration</span>
                      <span className="font-body-md font-semibold text-on-surface">{show.durationMinutes ? `${show.durationMinutes} mins` : 'TBA'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-label-md font-label-md text-outline">Schedules</span>
                      <span className="font-body-md font-semibold text-on-surface">{sortedSchedules.length}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-unit-md sm:grid-cols-2">
                  <div
                    className="h-48 overflow-hidden rounded-xl bg-cover bg-center shadow-sm transition-shadow hover:shadow-md"
                    style={{ backgroundImage: `url('${show.imageUrl || fallbackShowImage}')` }}
                  />
                  <div className="glass-panel flex h-48 flex-col justify-center rounded-xl p-unit-lg shadow-sm">
                    <span className="material-symbols-outlined text-4xl text-primary">confirmation_number</span>
                    <h3 className="mt-unit-sm font-headline-md text-headline-md text-on-surface">Ticket Availability</h3>
                    <p className="mt-2 text-body-sm text-on-surface-variant">
                      Choose one of the active schedules to continue with a real schedule ID.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-unit-lg lg:col-span-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Upcoming Times</h2>
                  <span className="flex items-center gap-1 text-label-md font-label-bold text-primary">
                    Active schedules <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  </span>
                </div>

                <div className="flex flex-col gap-unit-md">
                  {sortedSchedules.length === 0 ? (
                    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-unit-lg text-center shadow-sm">
                      <span className="material-symbols-outlined text-5xl text-primary">event_busy</span>
                      <h3 className="mt-unit-sm font-headline-md text-headline-md text-on-surface">No schedules available</h3>
                      <p className="mt-2 text-body-sm text-on-surface-variant">
                        This show is active, but there are no active schedules published yet.
                      </p>
                    </div>
                  ) : (
                    sortedSchedules.map((schedule) => {
                      const availability = scheduleAvailability(schedule);

                      return (
                        <div className={`group rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-unit-md shadow-sm transition-all hover:shadow-md ${availability.isUnavailable ? 'opacity-70' : ''}`} key={schedule.id}>
                          <div className="mb-unit-md flex items-start justify-between gap-unit-md">
                            <div className="flex flex-col">
                              <span className={`font-headline-md ${availability.isUnavailable ? 'text-outline' : 'text-primary'}`}>{formatTimeRange(schedule.startTime, schedule.endTime)}</span>
                              <span className="mt-1 flex items-center gap-1 text-label-md font-label-md text-on-surface-variant">
                                <span className="material-symbols-outlined text-[14px]">event</span>
                                {formatDateTime(schedule.startTime)}
                              </span>
                              <span className="mt-1 flex items-center gap-1 text-label-md font-label-md text-on-surface-variant">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                {schedule.venueName || 'Venue TBA'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-headline-md text-on-surface">{formatPrice(schedule.price)}</span>
                              <span className="block text-label-md font-label-md text-outline">per ticket</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-unit-md border-t border-outline-variant/20 pt-unit-md">
                            <div className="flex flex-col">
                              <span className="text-label-md font-label-md text-outline">Available</span>
                              <span className={`text-body-md ${availability.className}`}>{availability.label}</span>
                            </div>
                            {availability.isUnavailable ? (
                              <button className="cursor-not-allowed rounded-full bg-surface-variant px-6 py-2 font-button text-button text-on-surface-variant" disabled type="button">
                                {availability.buttonLabel}
                              </button>
                            ) : (
                              <Link className="rounded-full bg-primary px-6 py-2 font-button text-button text-on-primary transition hover:opacity-90" to={bookingUrl(show, schedule)}>
                                Book Now
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-unit-md rounded-xl bg-secondary-container/30 p-unit-md">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    info
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-bold text-secondary">Visitor Information</span>
                    <p className="text-body-sm text-on-secondary-container">
                      Please arrive 20 minutes before showtime. Ticket booking uses the selected schedule ID and latest backend availability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </MainLayout>
  );
}
