import apiClient from '../lib/apiClient.js';
import { getMockPaymentResponse } from './mockData.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function shouldUseMock(error, bookingId) {
  return import.meta.env.DEV && bookingId === 'mock' && (!error.response || [400, 401, 404].includes(error.response.status));
}

export async function createPayment(bookingId) {
  try {
    const response = await apiClient.post('/payments/create', { bookingId }, { skipAuthClear: true });
    return unwrap(response);
  } catch (error) {
    if (shouldUseMock(error, bookingId)) {
      return getMockPaymentResponse(bookingId);
    }
    throw error;
  }
}
