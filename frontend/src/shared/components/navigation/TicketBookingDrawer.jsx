import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { bookableDateOptions } from '../../../features/cart/showDetailSchedule.js';
import { getShowSchedules, getShows } from '../../../services/showService.js';
import {
  changeDrawerDate,
  changeDrawerShow,
  createDrawerSelection,
  drawerDestination,
} from './ticketBookingDrawerState.js';

export default function TicketBookingDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [selection, setSelection] = useState(createDrawerSelection);
  const [shows, setShows] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const scheduleRequest = useRef(0);
  const dates = useMemo(() => bookableDateOptions(schedules), [schedules]);
  const destination = drawerDestination(selection);

  useEffect(() => {
    if (!open) {
      scheduleRequest.current += 1;
      setSelection(createDrawerSelection());
      setSchedules([]);
      setError('');
      return undefined;
    }
    let active = true;
    setLoadingShows(true);
    setError('');
    getShows({ page: 0, size: 100 })
      .then((response) => {
        if (active) setShows(Array.isArray(response?.items) ? response.items : []);
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || 'Could not load shows. Please try again.');
      })
      .finally(() => {
        if (active) setLoadingShows(false);
      });
    return () => { active = false; };
  }, [open, reloadKey]);

  useEffect(() => {
    const requestId = ++scheduleRequest.current;
    setSchedules([]);
    if (!open || !selection.showId) {
      setLoadingSchedules(false);
      return undefined;
    }
    setLoadingSchedules(true);
    setError('');
    getShowSchedules(selection.showId)
      .then((items) => {
        if (scheduleRequest.current === requestId) {
          setSchedules(Array.isArray(items) ? items : []);
        }
      })
      .catch((loadError) => {
        if (scheduleRequest.current === requestId) {
          setError(loadError?.message || 'Could not load available dates. Please try again.');
        }
      })
      .finally(() => {
        if (scheduleRequest.current === requestId) setLoadingSchedules(false);
      });
    return () => {
      if (scheduleRequest.current === requestId) scheduleRequest.current += 1;
    };
  }, [open, reloadKey, selection.showId]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  return open ? (
    <div aria-label="Book tickets" aria-modal="true" className="fixed inset-0 z-[80]" role="dialog">
      <button aria-label="Close booking drawer" className="absolute inset-0 bg-slate-950/45" onClick={onClose} type="button" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-700">Book Now</p><h2 className="text-2xl font-black">Choose show and date</h2></div>
          <button aria-label="Close booking drawer" className="h-11 w-11 rounded-full border border-cyan-100" onClick={onClose} type="button">×</button>
        </div>
        <label className="mt-8 font-black" htmlFor="booking-show">Show</label>
        <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm border p-2" id="booking-show" value={selection.showId} onChange={(event) => setSelection((current) => changeDrawerShow(current, event.target.value))}>
          <option value="">Choose a show</option>
          {shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}
        </select>
        <label className="mt-6 font-black" htmlFor="booking-date">Date</label>
        <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm border p-2" disabled={!selection.showId || loadingSchedules} id="booking-date" value={selection.date} onChange={(event) => setSelection((current) => changeDrawerDate(current, event.target.value, dates))}>
          <option value="">Choose an available date</option>
          {dates.map((date) => <option key={date} value={date}>{date}</option>)}
        </select>
        {(loadingShows || loadingSchedules) && <p aria-live="polite" role="status">Loading available shows...</p>}
        {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)}>Try Again</button></div>}
        <button className="mt-auto rounded-full bg-gradient-to-r from-cyan-600 to-teal-700 px-6 py-4 font-black text-white disabled:opacity-40" disabled={!destination} type="button" onClick={() => { navigate(destination); onClose(); }}>Continue</button>
      </aside>
    </div>
  ) : null;
}
