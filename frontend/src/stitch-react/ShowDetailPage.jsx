import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { chooseShowDetailSchedule, localDateKey } from '../features/cart/showDetailSchedule.js';
import { createWorkspaceRequestTracker, detailWorkspaceNotice } from '../features/cart/showDetailWorkspaceState.js';
import ShowTicketWorkspace from '../features/cart/ShowTicketWorkspace.jsx';
import { getSchedule, getShowDetail, getShowSchedules } from '../services/showService.js';
import MainLayout from '../shared/layouts/MainLayout.jsx';

const fallbackImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAFeYRb8WkcNVQn2b1wxiXnDpTIB3-X8eybricRUgfMxWVfemwimDD2m_G_GiZUhW_oUx8L2aM98YoUGaHihmAaEQqP0rm5iBI3SgODMA9PSd0NfnZtfx2VUcNOrSewM73gS500HW-XbrSUG3zdcNdC8So1mOYMSf6xlwzSi_2NT6bph-dzQzqAEnmZZpyFgL9wvluMYa1G1kdZYz21Dkj9Bo62tfTY4Is8GpWRAQkP_Snkfi9PJX5FN0eml38fvqfFWooX13Cp5nq7',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBO-bCRxh2UwsQxWXeJUJQuejBAWT31c892YxMXztuGu0Qiet3S5wmaOfgfsTn_SUPEWKv1X6fk9ozFjATdo_XwJcKrUzd71xcZ23D4tZ6ZfLoCndPt_59a3YYz2GVMhx8HcTh4y1COQv2ckVTX-Ev3Z51bAF_Wt_3tcuciZ2ncN6t3rYm5JSzfG1n1igwxynE0qtDFsI-0VUrQxpgdC8ljcDDjgcU38xlZM1Q9kwJP4n6qCjB5ol5BT-Giw4ZnuRXZsEhTZHuJwkHO',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDKH4HodTfmDcO_ukYHvV3We2Q-2-5SLttCRwvL1CHxFklUt2phbyk4eI8rW-F9i9D6p6tO5PjQ76MSUDCwcyfMf9Y6EZIBLp5rA8zMy0vK2w3KHTDrxtu1aYv0iekjR0uol3OLMKn4v8zbnacHaaDt2J2KTkhRPYEvP5a303MDwaudUvNvhiBGtqL7QTtl3PgB5MzXTvsxKVFzspE7KOCOXvzvvoXkIkME5dBTAIIAIJUl7kIhTuJ_GVGs5HlpAx8Mr6LdkF1vpBxz',
];

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
            <Link className="rounded-full border border-outline-variant px-6 py-3 font-bold text-primary" to="/#shows">Back to shows</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ShowDetailPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [show, setShow] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [workspaceNotice, setWorkspaceNotice] = useState('');

  const [reloadKey, setReloadKey] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const workspaceRequest = useRef(createWorkspaceRequestTracker());

  const requestedDate = new URLSearchParams(location.search).get('date') || '';

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    setWorkspaceLoading(true);
    setWorkspaceError('');

    const requestId = workspaceRequest.current.begin();

    Promise.all([getShowDetail(showId), getShowSchedules(showId)])
      .then(async ([detail, list]) => {
        if (!active || !workspaceRequest.current.isCurrent(requestId)) return;
        
        const scheduleList = Array.isArray(list) ? list : detail?.schedules || [];
        const choice = chooseShowDetailSchedule(scheduleList, requestedDate);
        
        let authoritative = null;
        try {
          authoritative = choice.schedule
            ? await getSchedule(choice.schedule.id || choice.schedule.scheduleId)
            : null;
        } catch (error) {
          if (active && workspaceRequest.current.isCurrent(requestId)) {
             setWorkspaceError(error?.response?.data?.message || error?.message || 'Could not load schedule availability.');
          }
        }
        
        if (!active || !workspaceRequest.current.isCurrent(requestId)) return;

        setShow(detail);
        setSchedules(scheduleList);
        setSelectedSchedule(authoritative);
        setWorkspaceNotice(detailWorkspaceNotice({
          requestedDateUnavailable: choice.requestedDateUnavailable,
          requestedDate: choice.effectiveDate,
        }));
      })
      .catch((error) => {
        if (!active || !workspaceRequest.current.isCurrent(requestId)) return;
        setShow(null);
        setSchedules([]);
        setSelectedSchedule(null);
        setLoadError(getErrorState(error));
      })
      .finally(() => {
        if (active && workspaceRequest.current.isCurrent(requestId)) {
          setIsLoading(false);
          setWorkspaceLoading(false);
          if (location.hash === '#ticket-workspace') {
             setTimeout(() => {
                const el = document.getElementById('ticket-workspace');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
             }, 0);
          }
        }
      });
      
    return () => { 
      active = false;
      workspaceRequest.current.invalidate();
    };
  }, [reloadKey, showId, requestedDate, location.hash]);

  const handleWorkspaceScheduleChange = async (scheduleIdParam) => {
    const requestId = workspaceRequest.current.begin();
    setWorkspaceLoading(true);
    setWorkspaceError('');
    setWorkspaceNotice('');

    try {
       const authoritative = await getSchedule(scheduleIdParam);
       if (!workspaceRequest.current.isCurrent(requestId)) return;
       setSelectedSchedule(authoritative);
       const date = localDateKey(authoritative.startTime);
       navigate(`/shows/${encodeURIComponent(String(show.id))}?date=${date}#ticket-workspace`);
    } catch (error) {
       if (workspaceRequest.current.isCurrent(requestId)) {
          setWorkspaceError(error?.response?.data?.message || error?.message || 'Could not load schedule availability.');
       }
    } finally {
       if (workspaceRequest.current.isCurrent(requestId)) {
          setWorkspaceLoading(false);
       }
    }
  };

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
                <Link className="pointer-events-auto hover:text-primary-container" onClick={(event) => event.stopPropagation()} to="/#shows">Shows</Link>
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

            <ShowTicketWorkspace
              error={workspaceError}
              loading={workspaceLoading}
              notice={workspaceNotice}
              schedule={selectedSchedule}
              schedules={schedules}
              selectedScheduleId={selectedSchedule?.id || selectedSchedule?.scheduleId || ''}
              show={show}
              onRetry={() => setReloadKey((key) => key + 1)}
              onScheduleChange={handleWorkspaceScheduleChange}
            />

          </div>
        </section>
      </div>
    </MainLayout>
  );
}
