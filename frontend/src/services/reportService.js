import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function reportParams({ fromDate, toDate, showId, scheduleId } = {}) {
  return {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    showId: showId || undefined,
    scheduleId: scheduleId || undefined,
  };
}

export async function getDashboardReport(filters) {
  const response = await apiClient.get('/manager/reports/dashboard', { params: reportParams(filters) });
  return unwrap(response);
}

export async function getSalesReport(filters) {
  const response = await apiClient.get('/manager/reports/sales', { params: reportParams(filters) });
  return unwrap(response);
}

export async function getAttendanceReport(filters) {
  const response = await apiClient.get('/manager/reports/attendance', { params: reportParams(filters) });
  return unwrap(response);
}

export async function getBookingStatusReport(filters) {
  const response = await apiClient.get('/manager/reports/booking-status', { params: reportParams(filters) });
  return unwrap(response);
}
