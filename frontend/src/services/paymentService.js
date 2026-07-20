import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function createPayment(bookingId) {
  const response = await apiClient.post('/payments/create', { bookingId }, { skipAuthClear: true });
  return unwrap(response);
}

export async function reconcilePayment(bookingId) {
  const response = await apiClient.post('/payments/reconcile', { bookingId }, { skipAuthClear: true });
  return unwrap(response);
}
