import apiClient from '../lib/apiClient.js';
import { getMockTicketValidation } from './mockData.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function shouldUseMock(error) {
  return import.meta.env.DEV
    && import.meta.env.VITE_ENABLE_MOCK_VALIDATION === 'true'
    && !error.response;
}

export async function validateQr(qrCode) {
  try {
    const response = await apiClient.post('/tickets/validate', { qrCode }, { skipAuthClear: true });
    return unwrap(response);
  } catch (error) {
    if (shouldUseMock(error)) {
      return getMockTicketValidation(qrCode);
    }
    throw error;
  }
}
