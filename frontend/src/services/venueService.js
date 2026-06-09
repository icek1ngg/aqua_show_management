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
