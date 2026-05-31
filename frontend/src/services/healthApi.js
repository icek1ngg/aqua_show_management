import apiClient from '../lib/apiClient.js';

export async function getBackendHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}
