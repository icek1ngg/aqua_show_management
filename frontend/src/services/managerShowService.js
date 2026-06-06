import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getManagerShows({ keyword, status, page = 0, size = 10 } = {}) {
  const response = await apiClient.get('/manager/shows', {
    params: {
      keyword: keyword || undefined,
      status: status || undefined,
      page,
      size,
    },
  });
  return unwrap(response);
}

export async function getManagerShow(id) {
  const response = await apiClient.get(`/manager/shows/${id}`);
  return unwrap(response);
}

export async function createShow(payload) {
  const response = await apiClient.post('/manager/shows', payload);
  return unwrap(response);
}

export async function updateShow(id, payload) {
  const response = await apiClient.put(`/manager/shows/${id}`, payload);
  return unwrap(response);
}

export async function activateShow(id) {
  const response = await apiClient.patch(`/manager/shows/${id}/activate`);
  return unwrap(response);
}

export async function deactivateShow(id) {
  const response = await apiClient.patch(`/manager/shows/${id}/deactivate`);
  return unwrap(response);
}
