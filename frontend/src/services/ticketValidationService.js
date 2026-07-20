import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function validateQr(qrCode) {
  const response = await apiClient.post('/tickets/validate', { qrCode }, { skipAuthClear: true });
  return unwrap(response);
}
