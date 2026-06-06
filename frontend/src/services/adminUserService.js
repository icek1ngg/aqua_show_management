import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getAdminUsers({ keyword, role, status, page = 0, size = 10 } = {}) {
  const response = await apiClient.get('/admin/users', {
    params: {
      keyword: keyword || undefined,
      role: role || undefined,
      status: status || undefined,
      page,
      size,
    },
  });
  return unwrap(response);
}

export async function getAdminUser(id) {
  const response = await apiClient.get(`/admin/users/${id}`);
  return unwrap(response);
}

export async function updateAdminUser(id, payload) {
  const response = await apiClient.put(`/admin/users/${id}`, payload);
  return unwrap(response);
}

export async function disableAdminUser(id) {
  const response = await apiClient.patch(`/admin/users/${id}/disable`);
  return unwrap(response);
}

export async function enableAdminUser(id) {
  const response = await apiClient.patch(`/admin/users/${id}/enable`);
  return unwrap(response);
}
