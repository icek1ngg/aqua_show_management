import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildBookingUrl } from '../../../services/bookingService.js';
import { getShowSchedules, getShows } from '../../../services/showService.js';
import {
  sanitizeDigits,
  validateRequired,
} from '../../utils/validation.js';

const ticketTypes = ['Standard Entry', 'VIP Entry', 'Family Package'];

function formatScheduleOption(schedule) {
  const date = new Date(schedule.startTime);
  if (Number.isNaN(date.getTime())) {
    return 'Schedule time unavailable';
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isScheduleBookable(schedule) {
  const startTime = schedule?.startTime ? new Date(schedule.startTime) : null;
  return Boolean(
    startTime
    && !Number.isNaN(startTime.getTime())
    && startTime.getTime() > Date.now() + 30 * 60 * 1000
    && Number(schedule.availableTickets) > 0,
  );
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="ml-1 text-sm font-semibold text-red-600">{children}</p>;
}

export default function TicketSearchDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    showId: '',
    scheduleId: '',
    quantity: '',
    ticketType: '',
  });
  const [shows, setShows] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setIsLoadingOptions(true);
    setOptionsError('');
    getShows({ page: 0, size: 50 })
      .then((response) => {
        if (active) {
          setShows(Array.isArray(response?.items) ? response.items : []);
        }
      })
      .catch(() => {
        if (active) {
          setOptionsError('Could not load available shows.');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingOptions(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!formValues.showId) {
      setSchedules([]);
      return;
    }

    let active = true;
    setIsLoadingOptions(true);
    setOptionsError('');
    getShowSchedules(formValues.showId)
      .then((response) => {
        if (active) {
          setSchedules(Array.isArray(response) ? response : []);
        }
      })
      .catch(() => {
        if (active) {
          setSchedules([]);
          setOptionsError('Could not load schedules for this show.');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingOptions(false);
        }
      });

    return () => {
      active = false;
    };
  }, [formValues.showId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: name === 'quantity' ? sanitizeDigits(value, 2) : value,
      ...(name === 'showId' ? { scheduleId: '' } : {}),
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const quantityNumber = Number(formValues.quantity);
    const nextErrors = {
      showId: validateRequired(formValues.showId, 'Show'),
      scheduleId: validateRequired(formValues.scheduleId, 'Schedule'),
      quantity: validateRequired(formValues.quantity, 'Quantity')
        || (Number.isInteger(quantityNumber) && quantityNumber >= 1 && quantityNumber <= 10
          ? ''
          : 'Quantity must be a number from 1 to 10.'),
      ticketType: validateRequired(formValues.ticketType, 'Ticket type'),
    };

    const activeErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, message]) => message));
    if (Object.keys(activeErrors).length > 0) {
      setFieldErrors(activeErrors);
      return;
    }

    const selectedShow = shows.find((show) => show.id === formValues.showId);
    const selectedSchedule = schedules.find((schedule) => schedule.id === formValues.scheduleId);
    const showDate = selectedSchedule?.startTime
      ? String(selectedSchedule.startTime).slice(0, 10)
      : '';

    onClose();
    navigate(buildBookingUrl({
      showId: formValues.showId,
      scheduleId: formValues.scheduleId,
      showName: selectedShow?.title,
      showDate,
      quantity: formValues.quantity,
      ticketType: formValues.ticketType,
    }));
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="ticket-search-title">
      <button
        className="aquapulse-ticket-overlay absolute inset-0 h-full w-full bg-cyan-950/50 backdrop-blur-sm"
        type="button"
        aria-label="Close ticket search drawer"
        onClick={onClose}
      />

      <aside className="aquapulse-ticket-drawer absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-white shadow-2xl shadow-cyan-950/30 sm:rounded-l-[2rem]">
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-900 px-6 pb-8 pt-6 text-white sm:px-8">
          <div className="absolute -right-10 top-8 h-32 w-32 rounded-full border border-white/20 bg-white/10" />
          <div className="absolute bottom-4 left-8 h-16 w-16 rounded-full border border-cyan-100/25 bg-cyan-100/15" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-50">
                Search Tickets
              </p>
              <h2 className="text-3xl font-black tracking-tight" id="ticket-search-title">
                Book AquaPulse Tickets
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-cyan-50/85">
                Find the perfect show and ticket for your visit.
              </p>
            </div>
            <button
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              type="button"
              aria-label="Close ticket search drawer"
              onClick={onClose}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form className="relative flex-1 overflow-y-auto px-6 py-7 sm:px-8" onSubmit={handleSubmit}>
          <div className="pointer-events-none absolute right-8 top-10 h-24 w-24 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="relative z-10 space-y-5">
            <div className="space-y-2">
              <label className="ml-1 block text-sm font-bold text-slate-700" htmlFor="ticket-show">
                Select Show
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700">
                  water_drop
                </span>
                <select
                  className="w-full appearance-none rounded-2xl border border-cyan-100 bg-cyan-50/70 py-4 pl-12 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                  id="ticket-show"
                  name="showId"
                  value={formValues.showId}
                  onChange={handleChange}
                >
                  <option value="">{isLoadingOptions && shows.length === 0 ? 'Loading shows...' : 'Select a show'}</option>
                  {shows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {show.title}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  expand_more
                </span>
              </div>
              <FieldError>{fieldErrors.showId}</FieldError>
            </div>

            <div className="space-y-2">
              <label className="ml-1 block text-sm font-bold text-slate-700" htmlFor="ticket-schedule">
                Select Schedule
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700">
                  calendar_month
                </span>
                <select
                  className="w-full appearance-none rounded-2xl border border-cyan-100 bg-cyan-50/70 py-4 pl-12 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                  disabled={!formValues.showId || isLoadingOptions}
                  id="ticket-schedule"
                  name="scheduleId"
                  value={formValues.scheduleId}
                  onChange={handleChange}
                >
                  <option value="">{isLoadingOptions && formValues.showId ? 'Loading schedules...' : 'Select a schedule'}</option>
                  {schedules.map((schedule) => (
                    <option disabled={!isScheduleBookable(schedule)} key={schedule.id} value={schedule.id}>
                      {formatScheduleOption(schedule)}
                      {Number(schedule.availableTickets) <= 0 ? ' - Sold out' : !isScheduleBookable(schedule) ? ' - Booking closed' : ''}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  expand_more
                </span>
              </div>
              <FieldError>{fieldErrors.scheduleId}</FieldError>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 block text-sm font-bold text-slate-700" htmlFor="ticket-quantity">
                  Quantity
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700">
                    numbers
                  </span>
                  <input
                    className="w-full rounded-2xl border border-cyan-100 bg-cyan-50/70 py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                    id="ticket-quantity"
                    inputMode="numeric"
                    max="10"
                    min="1"
                    name="quantity"
                    pattern="[0-9]*"
                    placeholder="Ticket quantity"
                    type="text"
                    value={formValues.quantity}
                    onChange={handleChange}
                  />
                </div>
                <FieldError>{fieldErrors.quantity}</FieldError>
              </div>

              <div className="space-y-2">
                <label className="ml-1 block text-sm font-bold text-slate-700" htmlFor="ticket-type">
                  Ticket Type
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700">
                    confirmation_number
                  </span>
                  <select
                    className="w-full appearance-none rounded-2xl border border-cyan-100 bg-cyan-50/70 py-4 pl-12 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                    id="ticket-type"
                    name="ticketType"
                  value={formValues.ticketType}
                  onChange={handleChange}
                >
                  <option value="">Select type</option>
                  {ticketTypes.map((ticketType) => (
                      <option key={ticketType} value={ticketType}>
                        {ticketType}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    expand_more
                  </span>
                </div>
                <FieldError>{fieldErrors.ticketType}</FieldError>
              </div>
            </div>

            <button
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-800 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-800/25 transition hover:-translate-y-0.5 hover:shadow-cyan-800/35 active:translate-y-0"
              type="submit"
            >
              <span className="material-symbols-outlined">search</span>
              Search Tickets
            </button>

            {optionsError && <p className="text-center text-sm font-semibold text-red-600">{optionsError}</p>}
          </div>
        </form>
      </aside>
    </div>
  );
}
