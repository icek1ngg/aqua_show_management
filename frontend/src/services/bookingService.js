import apiClient from '../lib/apiClient.js';

function unwrapApiResponse(response) {
  return response.data?.data ?? response.data;
}

export function buildBookingUrl({
  showId,
  scheduleId,
  showName,
  showDate,
  quantity = 1,
  ticketType = 'Standard Entry',
}) {
  const requiredValues = [showId, scheduleId, showName, showDate, quantity, ticketType];
  if (requiredValues.some((value) => value === null || value === undefined || String(value).trim() === '')) {
    return null;
  }

  const params = new URLSearchParams({
    showId: String(showId),
    scheduleId: String(scheduleId),
    show: String(showName),
    date: String(showDate),
    quantity: String(quantity),
    ticketType: String(ticketType),
  });

  return `/bookings/create?${params.toString()}`;
}

export async function createBooking(payload) {
  const response = await apiClient.post('/bookings', payload);
  return unwrapApiResponse(response);
}

export async function getMyBookings({ page = 0, size = 5 } = {}) {
  const response = await apiClient.get('/bookings/my', {
    params: {
      page,
      size,
    },
  });
  return unwrapApiResponse(response);
}

export async function getBookingDetail(id) {
  const response = await apiClient.get(`/bookings/${id}`);
  return unwrapApiResponse(response);
}

export async function getBookingByHoldId(holdId) {
  const response = await apiClient.get(`/bookings/hold/${holdId}`);
  return unwrapApiResponse(response);
}
