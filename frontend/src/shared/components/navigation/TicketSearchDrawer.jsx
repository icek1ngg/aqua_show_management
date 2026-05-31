import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const showOptions = ['Symphony of Lights', 'Ocean Dreams', 'Aqua Parade', 'Mermaid Splash'];
const ticketTypes = ['Standard Entry', 'VIP Entry', 'Family Package'];

export default function TicketSearchDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    show: showOptions[0],
    date: '',
    guests: '2',
    ticketType: ticketTypes[0],
  });

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();
    Object.entries(formValues).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    onClose();
    navigate(`/bookings/create?${params.toString()}`);
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
                  name="show"
                  value={formValues.show}
                  onChange={handleChange}
                >
                  {showOptions.map((show) => (
                    <option key={show} value={show}>
                      {show}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 block text-sm font-bold text-slate-700" htmlFor="ticket-date">
                Select Date
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700">
                  calendar_month
                </span>
                <input
                  className="w-full rounded-2xl border border-cyan-100 bg-cyan-50/70 py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                  id="ticket-date"
                  name="date"
                  type="date"
                  value={formValues.date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 block text-sm font-bold text-slate-700" htmlFor="ticket-guests">
                  Guests
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700">
                    groups
                  </span>
                  <input
                    className="w-full rounded-2xl border border-cyan-100 bg-cyan-50/70 py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                    id="ticket-guests"
                    max="10"
                    min="1"
                    name="guests"
                    placeholder="Number of guests"
                    type="number"
                    value={formValues.guests}
                    onChange={handleChange}
                  />
                </div>
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
              </div>
            </div>

            <button
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-800 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-800/25 transition hover:-translate-y-0.5 hover:shadow-cyan-800/35 active:translate-y-0"
              type="submit"
            >
              <span className="material-symbols-outlined">search</span>
              Search Tickets
            </button>

            <p className="text-center text-xs leading-5 text-slate-500">
              This search uses mock values only. Ticket availability will be connected in a later phase.
            </p>
          </div>
        </form>
      </aside>
    </div>
  );
}
