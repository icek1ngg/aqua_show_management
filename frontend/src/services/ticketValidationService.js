import apiClient from '../lib/apiClient.js';
import { getMockTicketValidation } from './mockData.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function shouldUseMock(error) {
  return import.meta.env.DEV && (!error.response || [400, 401, 403, 404].includes(error.response.status));
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
