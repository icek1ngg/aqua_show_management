import { useEffect, useMemo, useState } from 'react';

import { getManagerShows } from '../services/managerShowService.js';
import {
  getAttendanceReport,
  getBookingStatusReport,
  getDashboardReport,
  getSalesReport,
} from '../services/reportService.js';
import { getSchedules } from '../services/scheduleService.js';
import ManagerActionBar from '../features/manager/components/ManagerActionBar.jsx';
import ManagerLayout from '../features/manager/components/ManagerLayout.jsx';
import ManagerPageHeader from '../features/manager/components/ManagerPageHeader.jsx';
import ManagerStatCard from '../features/manager/components/ManagerStatCard.jsx';

const emptyFilters = {
  fromDate: '',
  toDate: '',
  showId: '',
  scheduleId: '',
};

const bookingStatuses = ['PROCESSING', 'PENDING_PAYMENT', 'PAID', 'EXPIRED', 'FAILED'];

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('en-US').format(number) : '0';
}

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(number % 1 === 0 ? 0 : 1)}%` : '0%';
}

function formatStatus(status) {
  return status ? status.replaceAll('_', ' ') : 'TBA';
}

function formatDateTime(value) {
  if (!value) {
    return 'TBA';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateId(id) {
  return id ? `${String(id).slice(0, 8)}...` : 'TBA';
}

function safeCount(map, status) {
  return Number(map?.[status]) || 0;
}

function maxByShowRevenue(rows) {
  return Math.max(1, ...rows.map((row) => Number(row.revenue) || 0));
}

function statusTone(status) {
  if (status === 'PAID') {
    return 'bg-primary text-on-primary';
  }

  if (status === 'PROCESSING' || status === 'PENDING_PAYMENT') {
    return 'bg-tertiary-container text-on-tertiary-container';
  }

  return 'bg-error text-on-error';
}

function EmptySection({ icon = 'insights', message }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant/40 p-unit-lg text-center">
      <span className="material-symbols-outlined text-4xl text-on-surface-variant">{icon}</span>
      <p className="mt-unit-sm font-label-lg text-on-surface">{message}</p>
    </div>
  );
}

export default function ReportsAndAnalyticsPage() {
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [shows, setShows] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [sales, setSales] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [referenceError, setReferenceError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadShows() {
      try {
        const response = await getManagerShows({ page: 0, size: 100 });

        if (isActive) {
          setShows(Array.isArray(response?.items) ? response.items : []);
        }
      } catch (error) {
        if (isActive) {
          setReferenceError(getErrorMessage(error, 'Could not load shows for report filters.'));
        }
      }
    }

    loadShows();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSchedulesForShow() {
      if (!draftFilters.showId) {
        setSchedules([]);
        setIsScheduleLoading(false);
        return;
      }

      setIsScheduleLoading(true);
      setReferenceError('');

      try {
        const response = await getSchedules({ showId: draftFilters.showId, page: 0, size: 100 });

        if (isActive) {
          setSchedules(Array.isArray(response?.items) ? response.items : []);
        }
      } catch (error) {
        if (isActive) {
          setSchedules([]);
          setReferenceError(getErrorMessage(error, 'Could not load schedules for the selected show.'));
        }
      } finally {
        if (isActive) {
          setIsScheduleLoading(false);
        }
      }
    }

    loadSchedulesForShow();

    return () => {
      isActive = false;
    };
  }, [draftFilters.showId]);

  useEffect(() => {
    let isActive = true;

    async function loadReports() {
      setIsLoading(true);
      setLoadError('');

      try {
        const [dashboardResponse, salesResponse, attendanceResponse, statusResponse] = await Promise.all([
          getDashboardReport(appliedFilters),
          getSalesReport(appliedFilters),
          getAttendanceReport(appliedFilters),
          getBookingStatusReport(appliedFilters),
        ]);

        if (!isActive) {
          return;
        }

        setDashboard(dashboardResponse);
        setSales(salesResponse);
        setAttendance(attendanceResponse);
        setBookingStatus(statusResponse);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDashboard(null);
        setSales(null);
        setAttendance(null);
        setBookingStatus(null);
        setLoadError(getErrorMessage(error, 'Could not load reports.'));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isActive = false;
    };
  }, [appliedFilters, reloadKey]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setDraftFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'showId' ? { scheduleId: '' } : {}),
    }));
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
  }

  function resetFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const statusRows = useMemo(() => {
    const counts = bookingStatus?.counts || {};
    const total = bookingStatuses.reduce((sum, status) => sum + safeCount(counts, status), 0);

    return bookingStatuses.map((status) => {
      const count = safeCount(counts, status);
      return {
        status,
        count,
        percent: total > 0 ? Math.round((count * 1000) / total) / 10 : 0,
      };
    });
  }, [bookingStatus]);

  const revenueByShow = Array.isArray(sales?.revenueByShow) ? sales.revenueByShow : [];
  const maxRevenue = maxByShowRevenue(revenueByShow);
  const totalPending = safeCount(bookingStatus?.counts, 'PROCESSING') + safeCount(bookingStatus?.counts, 'PENDING_PAYMENT');
  const hasReports = Boolean(dashboard || sales || attendance || bookingStatus);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <style>{`body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f1fbfb;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .sidebar-active-indicator {
            box-shadow: 4px 0px 10px rgba(0, 105, 107, 0.2);
        }`}</style>

      <ManagerLayout
        contentClassName="mx-auto w-full max-w-[1600px] space-y-unit-lg p-unit-lg"
        headerTitle="Reports & Analytics"
        headerDescription="Booking, revenue, ticket, and check-in metrics"
      >
          <ManagerPageHeader
            title="Reports Dashboard"
            description="Analyze manager-owned booking, revenue, schedule, and attendance metrics."
          />

          <ManagerActionBar className="glass-card flex-col items-end shadow-sm md:flex-row">
            <div className="grid flex-1 grid-cols-1 gap-unit-md md:grid-cols-2 xl:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface-variant" htmlFor="report-from-date">From Date</label>
                <input
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-unit-md py-unit-sm text-body-sm focus:border-primary focus:ring-primary"
                  id="report-from-date"
                  name="fromDate"
                  type="date"
                  value={draftFilters.fromDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface-variant" htmlFor="report-to-date">To Date</label>
                <input
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-unit-md py-unit-sm text-body-sm focus:border-primary focus:ring-primary"
                  id="report-to-date"
                  name="toDate"
                  type="date"
                  value={draftFilters.toDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface-variant" htmlFor="report-show">Show</label>
                <select
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-unit-md py-unit-sm text-body-sm focus:border-primary focus:ring-primary"
                  id="report-show"
                  name="showId"
                  value={draftFilters.showId}
                  onChange={handleFilterChange}
                >
                  <option value="">All Shows</option>
                  {shows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {show.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface-variant" htmlFor="report-schedule">Schedule</label>
                <select
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-unit-md py-unit-sm text-body-sm focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!draftFilters.showId || isScheduleLoading}
                  id="report-schedule"
                  name="scheduleId"
                  value={draftFilters.scheduleId}
                  onChange={handleFilterChange}
                >
                  <option value="">{draftFilters.showId ? 'All Schedules' : 'Select a show first'}</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {formatDateTime(schedule.startTime)} - {schedule.venueName || truncateId(schedule.venueId)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-unit-sm">
              <button className="flex items-center gap-unit-sm rounded-full bg-primary px-unit-lg py-unit-sm font-label-lg text-on-primary shadow-lg transition-all hover:shadow-primary/20" type="button" onClick={applyFilters}>
                <span className="material-symbols-outlined text-[20px]">filter_alt</span>
                Apply
              </button>
              <button className="rounded-full bg-surface-container-high px-unit-lg py-unit-sm font-label-lg text-on-surface-variant transition-all hover:bg-surface-container-highest" type="button" onClick={resetFilters}>
                Reset
              </button>
            </div>
          </ManagerActionBar>

          {referenceError && (
            <div className="rounded-lg border border-error/20 bg-error/10 p-unit-md text-body-sm font-bold text-error">
              {referenceError}
            </div>
          )}

          {loadError && (
            <div className="rounded-lg border border-error/20 bg-error/10 p-unit-lg text-center">
              <span className="material-symbols-outlined text-4xl text-error">error</span>
              <p className="mt-unit-sm font-label-lg text-error">{loadError}</p>
              <button className="mt-unit-md rounded-lg bg-error px-unit-lg py-unit-sm font-label-lg text-on-error" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                Retry
              </button>
            </div>
          )}

          {isLoading && (
            <div className="glass-card flex min-h-[360px] flex-col items-center justify-center rounded-lg p-unit-lg text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
              <p className="mt-unit-md font-label-lg">Loading report data...</p>
            </div>
          )}

          {!isLoading && !loadError && !hasReports && <EmptySection message="No report data returned for this filter set." />}

          {!isLoading && !loadError && hasReports && (
            <>
              <div className="grid grid-cols-1 gap-unit-md md:grid-cols-3 lg:grid-cols-6">
                <ManagerStatCard icon="event_seat" label="Total Bookings" value={formatNumber(dashboard?.totalBookings)} />
                <ManagerStatCard icon="check_circle" label="Paid Bookings" tone="secondary" value={formatNumber(dashboard?.paidBookings)} />
                <ManagerStatCard icon="payments" label="Total Revenue" tone="tertiary" value={formatMoney(dashboard?.totalRevenue)} helper={`${formatNumber(sales?.totalTicketsSold ?? dashboard?.totalTicketsSold)} tickets sold`} />
                <ManagerStatCard icon="confirmation_number" label="Tickets Sold" tone="primary" value={formatNumber(dashboard?.totalTicketsSold)} />
                <ManagerStatCard icon="fact_check" label="Check-ins" tone="neutral" value={formatNumber(dashboard?.totalCheckIns)} helper={`Attendance ${formatPercent(dashboard?.attendanceRate)}`} />
                <ManagerStatCard icon="pending_actions" label="Pending / Failed / Expired" tone="error" value={`${formatNumber(totalPending)} / ${formatNumber(dashboard?.failedBookings)} / ${formatNumber(dashboard?.expiredBookings)}`} />
              </div>

              <div className="grid grid-cols-1 gap-unit-lg lg:grid-cols-12">
                <section className="glass-card rounded-lg p-unit-lg shadow-md lg:col-span-8">
                  <div className="mb-unit-lg flex items-center justify-between">
                    <h4 className="font-headline-md text-headline-md text-on-surface">Revenue by Show Performance</h4>
                    <span className="font-label-lg text-primary">{formatMoney(sales?.totalRevenue)} total</span>
                  </div>

                  {revenueByShow.length === 0 ? (
                    <EmptySection icon="bar_chart" message="No paid sales data for this filter set." />
                  ) : (
                    <div className="grid grid-cols-1 gap-unit-xl md:grid-cols-2">
                      {revenueByShow.map((row) => {
                        const revenue = Number(row.revenue) || 0;
                        const width = Math.max(4, Math.round((revenue / maxRevenue) * 100));

                        return (
                          <div key={row.showId || row.showName} className="space-y-unit-sm">
                            <div className="mb-1 flex items-end justify-between gap-unit-md">
                              <span className="truncate text-body-sm font-bold">{row.showName || truncateId(row.showId)}</span>
                              <span className="whitespace-nowrap font-label-lg text-primary">{formatMoney(row.revenue)}</span>
                            </div>
                            <div className="h-4 overflow-hidden rounded-full bg-surface-container">
                              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${width}%` }} />
                            </div>
                            <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant">{formatNumber(row.ticketsSold)} tickets sold</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="glass-card flex flex-col rounded-lg p-unit-lg shadow-md lg:col-span-4">
                  <h4 className="mb-unit-lg font-headline-md text-headline-md text-on-surface">Attendance &amp; Check-ins</h4>
                  {!attendance ? (
                    <EmptySection icon="groups" message="No attendance data returned." />
                  ) : (
                    <div className="flex flex-1 flex-col justify-center gap-unit-lg">
                      <div className="mx-auto flex h-48 w-48 flex-col items-center justify-center rounded-full border-[16px] border-primary-container text-center" style={{ borderRightColor: '#baeafe', borderBottomColor: '#ffdcc3' }}>
                        <span className="font-headline-lg text-primary">{formatPercent(attendance.checkInRate)}</span>
                        <span className="text-[10px] font-bold uppercase text-outline">Check-in Rate</span>
                      </div>
                      <div className="space-y-unit-sm">
                        <div className="flex justify-between text-body-sm">
                          <span>Total Valid Tickets</span>
                          <strong>{formatNumber(attendance.totalValidTickets)}</strong>
                        </div>
                        <div className="flex justify-between text-body-sm">
                          <span>Used Tickets</span>
                          <strong>{formatNumber(attendance.totalUsedTickets)}</strong>
                        </div>
                        <div className="flex justify-between text-body-sm">
                          <span>No-show Count</span>
                          <strong>{formatNumber(attendance.noShowCount)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <section className="glass-card overflow-hidden rounded-lg shadow-md">
                <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low/30 px-unit-lg py-unit-md">
                  <h4 className="font-headline-md text-on-surface">Booking Status Breakdown</h4>
                  <span className="text-body-sm text-on-surface-variant">Filtered by booking creation date</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-container-high/20 text-[12px] font-label-lg uppercase tracking-widest text-on-surface-variant">
                        <th className="px-unit-lg py-unit-md">Status</th>
                        <th className="px-unit-lg py-unit-md">Bookings</th>
                        <th className="px-unit-lg py-unit-md">Share</th>
                        <th className="px-unit-lg py-unit-md">Distribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-body-sm">
                      {statusRows.map((row) => (
                        <tr key={row.status} className="transition-colors hover:bg-primary/5">
                          <td className="px-unit-lg py-unit-md">
                            <span className={`inline-flex rounded-full px-3 py-1 text-label-md font-bold ${statusTone(row.status)}`}>{formatStatus(row.status)}</span>
                          </td>
                          <td className="px-unit-lg py-unit-md font-bold">{formatNumber(row.count)}</td>
                          <td className="px-unit-lg py-unit-md">{formatPercent(row.percent)}</td>
                          <td className="px-unit-lg py-unit-md">
                            <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, row.percent)}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}


        <footer className="mt-auto flex flex-col items-center justify-between border-t border-outline-variant/20 px-unit-lg py-unit-md text-[12px] text-on-surface-variant md:flex-row">
          <p>© 2024 AquaShow Management System. Precision in every splash.</p>
          <div className="mt-unit-sm flex gap-unit-lg md:mt-0">
            <a className="transition-colors hover:text-primary" href="/">Privacy Policy</a>
            <a className="transition-colors hover:text-primary" href="/manager/reports">Audit Logs</a>
            <a className="transition-colors hover:text-primary" href="mailto:support@aquashow.local">Support</a>
          </div>
        </footer>
      </ManagerLayout>
    </div>
  );
}
