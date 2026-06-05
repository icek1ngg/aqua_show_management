import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getManagerBookings({ showId, scheduleId, status, fromTime, toTime, page = 0, size = 10 } = {}) {
  const response = await apiClient.get('/manager/bookings', {
    params: {
      showId: showId || undefined,
      scheduleId: scheduleId || undefined,
      status: status || undefined,
      fromTime: fromTime || undefined,
      toTime: toTime || undefined,
      page,
      size,
    },
  });
  return unwrap(response);
}

export async function getManagerBookingDetail(id) {
  const response = await apiClient.get(`/manager/bookings/${id}`);
  return unwrap(response);
}
