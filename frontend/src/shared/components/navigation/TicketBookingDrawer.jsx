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
import CustomDropdown from '../ui/CustomDropdown.jsx';
import CustomDatePicker from '../ui/CustomDatePicker.jsx';

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
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 mb-1">AquaPulse</p>
            <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-800 to-teal-600 bg-clip-text text-transparent">Book Tickets</h2>
          </div>
          <button aria-label="Close booking drawer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition" onClick={onClose} type="button">
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="flex flex-col mb-8">
          {/* Show Selection */}
          <div className="flex items-center py-4 border-b border-gray-200">
            <span className="material-symbols-outlined text-cyan-600 mr-4 text-3xl">location_on</span>
            <div className="flex flex-col w-full relative">
              <label className="text-xs text-gray-500 font-medium mb-1 cursor-pointer">Select a destination</label>
              <CustomDropdown 
                options={shows.map(s => ({ value: s.id, label: s.title }))}
                value={selection.showId}
                onChange={(val) => setSelection((current) => changeDrawerShow(current, val))}
                placeholder="Where to?"
              />
            </div>
          </div>

          {/* Date Selection */}
          <div className="flex items-center py-4 border-b border-gray-200">
            <span className="material-symbols-outlined text-cyan-600 mr-4 text-3xl">calendar_month</span>
            <div className="flex flex-col w-full relative">
              <label className="text-xs text-gray-500 font-medium mb-1 cursor-pointer">Select a date</label>
              <CustomDatePicker 
                availableDates={dates}
                value={selection.date}
                onChange={(val) => setSelection((current) => changeDrawerDate(current, val, dates))}
                placeholder={selection.showId ? 'When?' : 'Select destination first'}
                disabled={!selection.showId || loadingSchedules}
                showId={selection.showId}
              />
            </div>
          </div>
        </div>

        {(loadingShows || loadingSchedules) && <p aria-live="polite" className="text-sm text-cyan-600 mb-4" role="status">Loading available shows...</p>}
        {error && <div className="mb-4 text-sm text-red-600" role="alert"><p>{error}</p><button className="underline font-bold mt-1" type="button" onClick={() => setReloadKey((key) => key + 1)}>Try Again</button></div>}
        
        <button 
          className="mt-auto w-full rounded-full bg-cyan-600 px-6 py-4 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-40 shadow-lg shadow-cyan-900/20" 
          disabled={!destination} 
          type="button" 
          onClick={() => { navigate(destination); onClose(); }}
        >
          Book tickets
        </button>
      </aside>
    </div>
  ) : null;
}
