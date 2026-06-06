import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getVenues({ keyword, status, page = 0, size = 10 } = {}) {
  const response = await apiClient.get('/manager/venues', {
    params: {
      keyword: keyword || undefined,
      status: status || undefined,
      page,
      size,
    },
  });
  return unwrap(response);
}

export async function getVenue(id) {
  const response = await apiClient.get(`/manager/venues/${id}`);
  return unwrap(response);
}

export async function createVenue(payload) {
  const response = await apiClient.post('/manager/venues', payload);
  return unwrap(response);
}

export async function updateVenue(id, payload) {
  const response = await apiClient.put(`/manager/venues/${id}`, payload);
  return unwrap(response);
}

export async function activateVenue(id) {
  const response = await apiClient.patch(`/manager/venues/${id}/activate`);
  return unwrap(response);
}

export async function deactivateVenue(id) {
  const response = await apiClient.patch(`/manager/venues/${id}/deactivate`);
  return unwrap(response);
}
