import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getRoles() {
  const response = await apiClient.get('/admin/roles');
  return unwrap(response);
}

export async function getUserRole(userId) {
  const response = await apiClient.get(`/admin/users/${userId}/role`);
  return unwrap(response);
}

export async function assignUserRole(userId, role) {
  const response = await apiClient.patch(`/admin/users/${userId}/role`, { role });
  return unwrap(response);
}
