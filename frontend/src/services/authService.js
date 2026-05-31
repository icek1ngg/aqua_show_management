import apiClient from '../lib/apiClient.js';

export async function login(credentials) {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
}

export async function register(payload) {
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get('/users/profile');
  return response.data;
}

export async function updateProfile(payload) {
  const response = await apiClient.put('/users/profile', payload);
  return response.data;
}

export async function logout() {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}

export async function resendVerification(email) {
  const response = await apiClient.post('/auth/resend-verification', { email });
  return response.data;
}

export async function forgotPassword(email) {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword({ token, newPassword, confirmPassword }) {
  const response = await apiClient.post('/auth/reset-password', { token, newPassword, confirmPassword });
  return response.data;
}
