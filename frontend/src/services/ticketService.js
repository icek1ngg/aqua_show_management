import apiClient from '../lib/apiClient.js';

export async function getMyTickets({ page = 0, size = 12, q = '', status = 'ALL', bookingId = null } = {}) {
  const response = await apiClient.get('/tickets/my', {
    params: {
      page,
      size,
      ...(q?.trim() ? { q: q.trim() } : {}),
      ...(status && status !== 'ALL' ? { status } : {}),
      ...(bookingId ? { bookingId } : {}),
    },
  });
  return response.data?.data ?? response.data;
}
