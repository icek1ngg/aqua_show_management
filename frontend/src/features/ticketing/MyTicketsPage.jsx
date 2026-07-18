import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import { getMyTickets } from '../../services/ticketService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import { normalizeBookingPaymentStatus } from '../../shared/utils/paymentStatus.js';
import { getTicketTypeLabel } from '../../shared/utils/ticketPricing.js';

const pollIntervalMs = 1500;
const ticketTimeoutMs = 30000;

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ticketQrImage(qrCode) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrCode)}`;
}

function TicketCard({ ticket, index }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
      <div className="bg-gradient-to-r from-cyan-800 to-teal-600 px-6 py-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">AquaPulse Ticket</p>
            <h2 className="mt-1 text-2xl font-black">Ticket {index + 1}</h2>
          </div>
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-black">{ticket.status}</span>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[220px_1fr] sm:items-center">
        <div className="rounded-3xl border border-cyan-100 bg-white p-3 shadow-sm">
          <img className="mx-auto aspect-square w-full" src={ticketQrImage(ticket.qrCode)} alt={`QR code for ticket ${index + 1}`} />
        </div>
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-black uppercase tracking-wider text-slate-400">Ticket ID</dt>
            <dd className="mt-1 break-all font-bold text-slate-900">{ticket.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-wider text-slate-400">Issued At</dt>
            <dd className="mt-1 font-bold text-slate-900">{formatDateTime(ticket.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-wider text-slate-400">QR Code</dt>
            <dd className="mt-1 break-all rounded-xl bg-cyan-50 px-3 py-2 font-mono text-sm font-semibold text-cyan-900">{ticket.qrCode}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function AllTicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalItems: 0, hasNext: false, hasPrevious: false });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(0); setQuery(search.trim()); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    getMyTickets({ page, size: 12, q: query, status })
      .then((response) => {
        if (!active) return;
        setTickets(Array.isArray(response?.items) ? response.items : []);
        setPagination({
          page: response?.page ?? page,
          totalPages: response?.totalPages ?? 0,
          totalItems: response?.totalItems ?? 0,
          hasNext: Boolean(response?.hasNext),
          hasPrevious: Boolean(response?.hasPrevious),
        });
      })
      .catch((loadError) => {
        if (!active) return;
        if (loadError?.response?.status === 401) {
          navigate('/login', { replace: true, state: { from: location } });
          return;
        }
        setError(loadError?.response?.data?.message || 'Unable to load your tickets.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [location, navigate, page, query, status]);

  return (
    <MainLayout>
      <section className="bg-gradient-to-br from-cyan-900 via-cyan-700 to-teal-500 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em]">My Tickets</span>
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">All Your AquaPulse Tickets</h1>
          <p className="mt-3 text-cyan-50/90">Search and access tickets from every paid booking.</p>
        </div>
      </section>
      <main className="mx-auto min-h-[520px] max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 rounded-3xl border border-cyan-100 bg-cyan-50/50 p-5 sm:flex-row">
          <input className="flex-1 rounded-full border border-cyan-200 bg-white px-5 py-3 outline-none focus:border-cyan-600" onChange={(event) => setSearch(event.target.value)} placeholder="Search by show or booking code" value={search} />
          <select className="rounded-full border border-cyan-200 bg-white px-5 py-3 font-bold text-slate-700" onChange={(event) => { setPage(0); setStatus(event.target.value); }} value={status}>
            <option value="ALL">All statuses</option><option value="VALID">Valid</option><option value="USED">Used</option><option value="EXPIRED">Expired</option>
          </select>
        </div>
        {isLoading ? <p className="py-16 text-center font-bold text-cyan-700">Loading your tickets...</p> : null}
        {!isLoading && error ? <p className="rounded-2xl bg-red-50 p-8 text-center font-bold text-red-700">{error}</p> : null}
        {!isLoading && !error && tickets.length === 0 ? <p className="rounded-2xl border border-dashed border-cyan-200 p-12 text-center font-bold text-slate-600">No tickets match your filters.</p> : null}
        {!isLoading && !error && tickets.length > 0 ? (
          <div className="space-y-8">
            {tickets.map((ticket, index) => (
              <section key={ticket.id}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div><h2 className="text-2xl font-black text-slate-950">{ticket.showName}</h2><p className="font-semibold text-slate-500">{formatDateTime(ticket.showStartTime)} · {getTicketTypeLabel(ticket.ticketType)} · {ticket.passengerType || 'ADULT'}</p></div>
                  <Link className="font-bold text-cyan-700 hover:underline" to={`/bookings/${ticket.bookingId}`}>Booking {ticket.bookingCode}</Link>
                </div>
                <TicketCard index={index} ticket={ticket} />
              </section>
            ))}
          </div>
        ) : null}
        {!isLoading && pagination.totalItems > 0 ? <div className="mt-10 flex items-center justify-center gap-4"><button className="rounded-full border px-5 py-2 font-bold disabled:opacity-40" disabled={!pagination.hasPrevious} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button><span className="font-bold">Page {pagination.page + 1} of {Math.max(1, pagination.totalPages)}</span><button className="rounded-full border px-5 py-2 font-bold disabled:opacity-40" disabled={!pagination.hasNext} onClick={() => setPage((value) => value + 1)}>Next</button></div> : null}
      </main>
    </MainLayout>
  );
}

function BookingTicketsPage({ bookingId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const loadTickets = useCallback(async () => {
    stopPolling();
    if (!bookingId) {
      setError('Booking ID is missing.');
      setIsLoading(false);
      return;
    }

    try {
      const detail = await getBookingDetail(bookingId);
      if (!mountedRef.current) {
        return;
      }

      const { status } = normalizeBookingPaymentStatus(detail, detail?.payment);
      const tickets = detail?.tickets?.items || [];
      setBooking(detail);
      setError('');
      setIsLoading(false);

      if (status === 'PAID' && tickets.length === 0) {
        if (Date.now() - startedAtRef.current >= ticketTimeoutMs) {
          setTimedOut(true);
          return;
        }
        timerRef.current = window.setTimeout(loadTickets, pollIntervalMs);
      } else {
        setTimedOut(false);
      }
    } catch (loadError) {
      if (!mountedRef.current) {
        return;
      }
      if (loadError?.response?.status === 401) {
        navigate('/login', { replace: true, state: { from: location } });
        return;
      }
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load your tickets.');
      setIsLoading(false);
    }
  }, [bookingId, location, navigate, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    startedAtRef.current = Date.now();
    loadTickets();

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [loadTickets, stopPolling]);

  const retry = () => {
    startedAtRef.current = Date.now();
    setTimedOut(false);
    setIsLoading(true);
    loadTickets();
  };

  const paymentStatus = normalizeBookingPaymentStatus(booking, booking?.payment).status;
  const tickets = booking?.tickets?.items || [];
  const isPreparing = paymentStatus === 'PAID' && tickets.length === 0;
  const bookingItems = Array.isArray(booking?.items) ? booking.items : [];
  const ticketGroups = bookingItems.map((item) => ({
    item,
    tickets: tickets.filter((ticket) => ticket.bookingItemId === item.id),
  }));
  const ungroupedTickets = tickets.filter((ticket) => !bookingItems.some((item) => item.id === ticket.bookingItemId));

  return (
    <MainLayout>
      <section className="bg-gradient-to-br from-cyan-900 via-cyan-700 to-teal-500 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em]">My Tickets</span>
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">{bookingItems.length > 1 ? `${bookingItems.length} Shows in Your Booking` : booking?.showName || 'Your AquaPulse Tickets'}</h1>
          <p className="mt-3 max-w-2xl text-lg text-cyan-50/90">Keep this page ready when you arrive at the show entrance.</p>
        </div>
      </section>

      <section className="min-h-[520px] bg-gradient-to-b from-cyan-50/60 to-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {isLoading ? (
            <div className="rounded-[2rem] border border-cyan-100 bg-white p-10 text-center shadow-lg">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-700" />
              <p className="mt-4 font-bold text-slate-600">Loading your tickets...</p>
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-lg" role="alert">
              <span className="material-symbols-outlined !text-5xl text-red-500">error</span>
              <h2 className="mt-3 text-2xl font-black text-slate-950">Tickets unavailable</h2>
              <p className="mt-2 font-semibold text-slate-600">{error}</p>
              <button className="mt-6 rounded-full bg-cyan-700 px-6 py-3 font-black text-white hover:bg-cyan-800" onClick={retry} type="button">Try Again</button>
            </div>
          ) : null}

          {!isLoading && !error && isPreparing ? (
            <div className="rounded-[2rem] border border-emerald-200 bg-white p-10 text-center shadow-lg" role="status">
              <span className="material-symbols-outlined !text-6xl text-emerald-600">hourglass_top</span>
              <h2 className="mt-4 text-3xl font-black text-slate-950">Payment successful!</h2>
              <p className="mt-3 text-lg font-semibold text-slate-600">Payment was successful. Your ticket is being prepared.</p>
              {!timedOut ? <p className="mt-3 text-sm font-semibold text-cyan-700">Checking again automatically...</p> : null}
              {timedOut ? (
                <button className="mt-6 rounded-full bg-cyan-700 px-6 py-3 font-black text-white hover:bg-cyan-800" onClick={retry} type="button">Check Again</button>
              ) : null}
            </div>
          ) : null}

          {!isLoading && !error && booking && paymentStatus !== 'PAID' ? (
            <div className="rounded-[2rem] border border-yellow-200 bg-white p-10 text-center shadow-lg">
              <span className="material-symbols-outlined !text-6xl text-yellow-600">payments</span>
              <h2 className="mt-4 text-3xl font-black text-slate-950">Tickets are not available yet</h2>
              <p className="mt-3 font-semibold text-slate-600">This booking has not been confirmed as paid.</p>
            </div>
          ) : null}

          {tickets.length > 0 ? (
            <div className="space-y-10">
              {ticketGroups.filter((group) => group.tickets.length > 0).map(({ item, tickets: groupTickets }) => (
                <section key={item.id}>
                  <h2 className="text-2xl font-black text-slate-950">{item.showName}</h2>
                  <p className="mb-4 mt-1 font-semibold text-slate-500">{formatDateTime(item.startTime)} · {getTicketTypeLabel(item.ticketType)} · {item.passengerType || 'ADULT'}</p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {groupTickets.map((ticket, index) => <TicketCard key={ticket.id} ticket={ticket} index={index} />)}
                  </div>
                </section>
              ))}
              {ungroupedTickets.length > 0 ? (
                <section>
                  <h2 className="mb-4 text-2xl font-black text-slate-950">Other Tickets</h2>
                  <div className="grid gap-6 lg:grid-cols-2">{ungroupedTickets.map((ticket, index) => <TicketCard key={ticket.id} ticket={ticket} index={index} />)}</div>
                </section>
              ) : null}
            </div>
          ) : null}

          {!isLoading ? (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {bookingId ? (
                <Link className="rounded-full border border-cyan-200 bg-white px-6 py-3 text-center font-black text-cyan-700 hover:bg-cyan-50" to={`/bookings/${bookingId}`}>
                  Booking Detail
                </Link>
              ) : null}
              <Link className="rounded-full border border-cyan-200 bg-white px-6 py-3 text-center font-black text-cyan-700 hover:bg-cyan-50" to="/bookings/my">
                My Bookings
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}

export default function MyTicketsPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  return bookingId ? <BookingTicketsPage bookingId={bookingId} /> : <AllTicketsPage />;
}
