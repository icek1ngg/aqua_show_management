import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { showTicketTarget } from '../cart/showTicketNavigation.js';
import { featuredShowsFromSchedules, sortUpcomingSchedules } from './homeScheduleState.js';
import { getUpcomingSchedules } from '../../services/showService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';

const FEATURED_SHOWS_PAGE_SIZE = 6;

const fallbackShowImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANv7I9nTUaKmdiA6IfaIaY0YwJUIWoqM0X6m_tgMmcJ71PacmGbCJL7U7jN8rhBXSUuV7fovx9LDsAc6N5PhTyiCp6LssLe6FgDdZmMcwFIlWNhrmPMXPWNaNGaENraIJuHz9U8O5qXFdHXwD12d0tWFF6pkX61XHVJWiPscKVSeVXPJHPLntIinpKKiq48E_jrrE2A6BF6g5CVGhbzwWhTMCs07mHdwovKDWCZJwE9QP5SidUIrVjslByRhoxaZve3By201M-MkjJ';

const benefits = [
  {
    icon: 'bolt',
    title: 'Easy Booking',
    description: 'Instant confirmation and secure ticket management in just 3 clicks.',
  },
  {
    icon: 'verified_user',
    title: 'Secure Payment',
    description: 'Your data is protected by industry-leading encryption standards.',
  },
  {
    icon: 'confirmation_number',
    title: 'Fast Entry',
    description: 'Move smoothly from booking to showtime with clear reservation details.',
  },
  {
    icon: 'notifications_active',
    title: 'Real-time Updates',
    description: 'Get live notifications about show timings and seat availability.',
  },
];

function getHomepageErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Could not load upcoming shows. Please try again.';
}

function formatScheduleDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    day: date.toLocaleDateString('en-US', { day: '2-digit' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function scheduleStatus(show) {
  return (show.nextStartTime || show.startTime)
    ? {
        label: 'Upcoming',
        className: 'bg-emerald-50 text-emerald-600',
        dotClass: 'bg-emerald-600 animate-pulse',
      }
    : {
        label: 'Schedule pending',
        className: 'bg-slate-100 text-slate-500',
        dotClass: 'bg-slate-400',
      };
}

function normalizeSectionId(sectionId) {
  if (sectionId === 'schedules') {
    return 'schedule';
  }

  return sectionId;
}

function scrollToSection(sectionId) {
  const normalizedSectionId = normalizeSectionId(sectionId);

  if (normalizedSectionId === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  document.getElementById(normalizedSectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

import TicketSearchBar from './TicketSearchBar.jsx';

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scheduleItems, setScheduleItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [isLoadingShows, setIsLoadingShows] = useState(true);
  const [showsError, setShowsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const sectionId = normalizeSectionId(
      location.state?.scrollTo ||
      location.hash?.replace('#', '') ||
      (location.pathname === '/shows' || location.pathname === '/public/shows' ? 'shows' : ''),
    );

    if (!sectionId) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToSection(sectionId);
    });
    const settleScrollId = window.setTimeout(() => {
      scrollToSection(sectionId);
    }, 350);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(settleScrollId);
    };
  }, [location.hash, location.pathname, location.state]);

  useEffect(() => {
    let isActive = true;

    async function loadHomepageSchedules() {
      setIsLoadingShows(true);
      setShowsError('');

      try {
        const response = await getUpcomingSchedules();
        if (!isActive) {
          return;
        }

        setScheduleItems(Array.isArray(response) ? response : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setScheduleItems([]);
        setShowsError(getHomepageErrorMessage(error));
      } finally {
        if (isActive) {
          setIsLoadingShows(false);
        }
      }
    }

    loadHomepageSchedules();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  const upcomingSchedules = useMemo(
    () =>
      sortUpcomingSchedules(scheduleItems)
        .map((schedule) => ({ ...schedule, formattedSchedule: formatScheduleDate(schedule.startTime) }))
        .filter((schedule) => schedule.formattedSchedule),
    [scheduleItems],
  );
  const matchingFeaturedShows = useMemo(
    () => featuredShowsFromSchedules(scheduleItems, submittedKeyword),
    [scheduleItems, submittedKeyword],
  );
  const totalFeaturedPages = Math.ceil(matchingFeaturedShows.length / FEATURED_SHOWS_PAGE_SIZE);
  const featuredPage = Math.min(currentPage, Math.max(0, totalFeaturedPages - 1));
  const shows = matchingFeaturedShows.slice(
    featuredPage * FEATURED_SHOWS_PAGE_SIZE,
    (featuredPage + 1) * FEATURED_SHOWS_PAGE_SIZE,
  );
  const pagination = {
    page: featuredPage,
    totalItems: matchingFeaturedShows.length,
    totalPages: totalFeaturedPages,
    hasNext: featuredPage + 1 < totalFeaturedPages,
    hasPrevious: featuredPage > 0,
  };

  const goToShowTickets = (schedule) => {
    navigate(showTicketTarget({
      showId: schedule?.showId || schedule?.id,
      date: schedule?.startTime?.slice(0, 10),
    }));
  };

  const handleShowSearch = (event) => {
    event.preventDefault();
    setSubmittedKeyword(keyword.trim());
    setCurrentPage(0);
  };

  const clearShowSearch = () => {
    setKeyword('');
    setSubmittedKeyword('');
    setCurrentPage(0);
  };

  return (
    <MainLayout>
      <section className="relative flex min-h-[600px] scroll-mt-24 items-center lg:min-h-[720px]" id="home">
        <div className="absolute inset-0 z-0">
          <img
            alt="Water park pool with turquoise slides"
            className="h-full w-full object-cover"
            src="/grand-voyage-banner.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-cyan-950/35 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 text-white sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
              AquaPulse Water Park
            </p>
            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Dive Into <span className="text-cyan-300">Magical</span> Water Shows
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-cyan-50/90">
              Discover spectacular performances, book tickets online, and enjoy unforgettable moments at AquaPulse.
              Experience the harmony of light, water, and music.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button className="rounded-full border-2 border-white/30 bg-white/10 px-10 py-4 font-bold text-white backdrop-blur-md transition hover:bg-white/20" type="button" onClick={() => scrollToSection('shows')}>
                Explore Shows
              </button>
            </div>
          </div>
          
          <div className="mt-12 md:mt-16 w-full relative z-20">
            <TicketSearchBar />
          </div>
        </div>
      </section>



      <section className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8" id="shows">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 block text-sm font-bold uppercase tracking-[0.24em] text-cyan-700">Performances</span>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Featured Water Shows</h2>
          </div>
          <form className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[320px]" onSubmit={handleShowSearch}>
            <label className="sr-only" htmlFor="show-keyword">
              Search upcoming shows
            </label>
            <div className="flex rounded-full border border-cyan-100 bg-white p-1 shadow-sm">
              <input
                className="min-w-0 flex-1 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                id="show-keyword"
                placeholder="Search shows..."
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <button className="rounded-full bg-cyan-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-cyan-800" type="submit">
                Search
              </button>
            </div>
            {submittedKeyword && (
              <button className="self-end text-sm font-bold text-cyan-700 transition hover:text-cyan-900" type="button" onClick={clearShowSearch}>
                Clear search
              </button>
            )}
          </form>
        </div>

        {isLoadingShows ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <article className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-sm" key={index}>
                <div className="h-72 animate-pulse bg-cyan-50" />
                <div className="space-y-4 p-8">
                  <div className="h-7 w-3/4 animate-pulse rounded-full bg-cyan-50" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-12 w-full animate-pulse rounded-full bg-cyan-50" />
                </div>
              </article>
            ))}
          </div>
        ) : showsError ? (
          <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-red-500">error</span>
            <h3 className="mt-3 text-2xl font-black text-slate-950">Could not load shows</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-red-700">{showsError}</p>
            <button className="mt-6 rounded-full bg-cyan-700 px-6 py-3 font-bold text-white transition hover:bg-cyan-800" type="button" onClick={() => setReloadKey((key) => key + 1)}>
              Try Again
            </button>
          </div>
        ) : shows.length === 0 ? (
          <div className="rounded-[2rem] border border-cyan-100 bg-white p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-cyan-700">theater_comedy</span>
            <h3 className="mt-3 text-2xl font-black text-slate-950">No upcoming shows found</h3>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              {submittedKeyword ? 'No upcoming shows match your search yet.' : 'There are no upcoming shows available right now. Please check back soon.'}
            </p>
            {submittedKeyword && (
              <button className="mt-6 rounded-full bg-cyan-700 px-6 py-3 font-bold text-white transition hover:bg-cyan-800" type="button" onClick={clearShowSearch}>
                Show all upcoming shows
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {shows.map((show) => {
                const status = scheduleStatus(show);
                const nextSchedule = formatScheduleDate(show.nextStartTime);

                return (
                  <article className="group overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-950/10" key={show.id}>
                    <div className="relative h-72 overflow-hidden">
                      <img alt={show.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={show.imageUrl || fallbackShowImage} />
                      <span className={`absolute left-5 top-5 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold shadow-lg ${status.className}`}>
                        <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                        {status.label}
                      </span>
                      <div className="absolute bottom-5 right-5 rounded-full bg-white/95 px-4 py-1.5 shadow-lg backdrop-blur">
                        <span className="font-bold text-cyan-700">{show.durationMinutes ? `${show.durationMinutes} min` : 'Duration TBA'}</span>
                      </div>
                    </div>
                    <div className="p-8">
                      <h3 className="mb-3 text-2xl font-black text-slate-950">{show.title}</h3>
                      <p className="mb-5 line-clamp-2 text-slate-600">{show.shortDescription || 'More show details are coming soon.'}</p>
                      <div className="mb-8 rounded-2xl bg-cyan-50/70 p-4 text-sm text-slate-600">
                        <p className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="material-symbols-outlined text-base text-cyan-700">event</span>
                          {nextSchedule ? nextSchedule.full : 'Next schedule coming soon'}
                        </p>
                        {show.venueName && (
                          <p className="mt-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-cyan-700">location_on</span>
                            {show.venueName}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <Link className="rounded-full border-2 border-cyan-700 py-3.5 text-center font-bold text-cyan-700 transition hover:bg-cyan-50" to={`/shows/${show.id}`}>View Details</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-cyan-100 bg-white p-4 shadow-sm sm:flex-row">
                <p className="text-sm font-semibold text-slate-600">
                  Page {pagination.page + 1} of {pagination.totalPages} ({pagination.totalItems} shows)
                </p>
                <div className="flex gap-3">
                  <button
                    className="rounded-full border border-cyan-200 px-5 py-2.5 font-bold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!pagination.hasPrevious}
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-full bg-cyan-700 px-5 py-2.5 font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!pagination.hasNext}
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>



      <section className="scroll-mt-24 bg-white/60 py-20" id="schedule">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Upcoming Show Schedules</h2>
            <div className="mx-auto mb-6 h-1 w-20 rounded-full bg-cyan-500" />
            <p className="mx-auto max-w-xl text-slate-600">
              Plan your visit ahead. Check the latest show timings and real-time availability for our main stages.
            </p>
          </div>

          <div className="space-y-6">
            {isLoadingShows ? (
              <article className="rounded-[2rem] border border-cyan-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-700" />
                <p className="mt-4 font-bold text-slate-600">Loading upcoming schedules...</p>
              </article>
            ) : upcomingSchedules.length === 0 ? (
              <article className="rounded-[2rem] border border-cyan-100 bg-white p-8 text-center shadow-sm">
                <span className="material-symbols-outlined text-5xl text-cyan-700">event_busy</span>
                <h3 className="mt-3 text-2xl font-black text-slate-950">No upcoming schedules</h3>
                <p className="mt-2 text-slate-600">No future active show schedules have been published yet.</p>
              </article>
            ) : (
              upcomingSchedules.map((schedule) => {
                const status = scheduleStatus(schedule);

                return (
                  <article className="flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:shadow-lg md:flex-row" key={schedule.scheduleId}>
                <div className="flex w-full items-center gap-6 md:w-1/4">
                  <div className="min-w-[90px] rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-center">
                    <p className="text-2xl font-black text-cyan-700">{schedule.formattedSchedule.day}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{schedule.formattedSchedule.month}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-cyan-700">{schedule.formattedSchedule.time}</p>
                    <p className="text-sm text-slate-500">{schedule.durationMinutes ? `${schedule.durationMinutes} minute show` : 'Show duration TBA'}</p>
                  </div>
                </div>

                <div className="w-full text-center md:w-1/3 md:text-left">
                  <h3 className="text-xl font-black text-slate-950">{schedule.showTitle}</h3>
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-600 md:justify-start">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {schedule.venueName || 'Venue TBA'}
                  </p>
                </div>

                <div className="flex w-full items-center justify-between gap-6 md:w-auto md:justify-end">
                  <span className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${status.className}`}>
                    <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                    {status.label}
                  </span>
                  <button className="rounded-full bg-cyan-700 px-8 py-3.5 font-bold text-white shadow-md transition hover:bg-cyan-800" type="button" onClick={() => goToShowTickets(schedule)}>
                    Book tickets
                  </button>
                </div>
              </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-center gap-6">
          <h2 className="shrink-0 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Exclusive Promotions</h2>
          <div className="h-px flex-1 bg-cyan-200" />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <article className="relative flex min-h-[400px] flex-col justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-400 to-teal-800 p-8 text-white shadow-2xl shadow-cyan-950/20 md:p-12">
            <div className="relative z-10 space-y-6">
              <span className="rounded-full border border-white/30 bg-white/20 px-5 py-1.5 text-sm font-bold uppercase tracking-[0.18em] backdrop-blur-md">
                Limited Time
              </span>
              <h3 className="text-4xl font-black leading-tight md:text-5xl">
                Summer Splash
                <br />
                Family Bundle
              </h3>
              <p className="max-w-sm text-lg text-white/80">Get 4 tickets for the price of 3 plus free snacks and drinks for the kids.</p>
              <Link className="mt-4 block w-fit rounded-full bg-yellow-300 px-10 py-4 font-black text-slate-950 transition hover:shadow-xl active:scale-95" to="/#shows">
                Grab Offer
              </Link>
            </div>
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-10 top-10 h-40 w-40 rounded-full border border-white/10 bg-white/5" />
            <span className="material-symbols-outlined absolute bottom-8 right-8 select-none text-[120px] leading-none opacity-10">waves</span>
          </article>

          <article className="relative flex min-h-[400px] flex-col justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#ff6900] to-[#a43c12] p-8 text-white shadow-2xl shadow-orange-950/20 md:p-12">
            <div className="relative z-10 space-y-6">
              <span className="rounded-full border border-white/30 bg-white/20 px-5 py-1.5 text-sm font-bold uppercase tracking-[0.18em] backdrop-blur-md">
                Members Only
              </span>
              <h3 className="text-4xl font-black leading-tight md:text-5xl">
                VIP Season Pass
                <br />
                Early Access
              </h3>
              <p className="max-w-sm text-lg text-white/80">Enjoy unlimited entries and priority seating for all premium shows this season.</p>
              <Link className="mt-4 block w-fit rounded-full bg-white px-10 py-4 font-black text-cyan-800 transition hover:shadow-xl active:scale-95" to="/#shows">
                Explore Perks
              </Link>
            </div>
            <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <span className="material-symbols-outlined absolute bottom-8 right-8 select-none text-[120px] leading-none opacity-10">stars</span>
          </article>
        </div>
      </section>

      <section className="bg-cyan-50/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Why Book With AquaPulse?</h2>
            <div className="mx-auto h-1.5 w-24 rounded-full bg-cyan-500" />
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
            {benefits.map((benefit) => (
              <article className="group text-center" key={benefit.title}>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white text-cyan-700 shadow-md transition duration-300 group-hover:bg-cyan-700 group-hover:text-white">
                  <span className="material-symbols-outlined text-4xl">{benefit.icon}</span>
                </div>
                <h3 className="mb-3 text-xl font-black text-slate-950">{benefit.title}</h3>
                <p className="px-4 text-sm leading-6 text-slate-600">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </MainLayout>
  );
}
