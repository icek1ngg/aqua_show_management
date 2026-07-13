import apiClient from '../lib/apiClient.js';
import { normalizeTicketType } from '../shared/utils/ticketPricing.js';

function unwrapApiResponse(response) {
  return response.data?.data ?? response.data;
}

export async function createBooking(payload) {
  const response = await apiClient.post('/bookings', {
    ...payload,
    ticketType: normalizeTicketType(payload.ticketType),
  });
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
