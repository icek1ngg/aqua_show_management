import apiClient from '../lib/apiClient.js';

export async function getSessions() {
  const response = await apiClient.get('/users/sessions');
  return response.data;
}

export async function revokeSession(id) {
  const response = await apiClient.delete(`/users/sessions/${id}`);
  return response.data;
}

export async function revokeAllOtherSessions() {
  const response = await apiClient.delete('/users/sessions');
  return response.data;
}
