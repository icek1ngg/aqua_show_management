import axios from 'axios';

import { clearStoredToken, getAccessToken } from '../features/auth/authStorage.js';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestHeaders = error.config?.headers;
    const hadAuthHeader = Boolean(
      requestHeaders?.Authorization ||
      requestHeaders?.authorization ||
      (typeof requestHeaders?.get === 'function' && requestHeaders.get('Authorization')),
    );

    if (error.response?.status === 401 && hadAuthHeader && !error.config?.skipAuthClear) {
      clearStoredToken();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
