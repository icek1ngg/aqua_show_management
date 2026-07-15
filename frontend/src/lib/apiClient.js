import axios from 'axios';

import { getAccessToken, clearAccessToken } from '../features/auth/authTokenStore.js';
import { performRefresh, broadcastLogout } from '../features/auth/authRefreshCoordinator.js';

const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
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

  // Extract XSRF-TOKEN from cookies
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  if (match && match[1]) {
    const xsrfToken = match[1];
    if (typeof config.headers?.set === 'function') {
      config.headers.set('X-XSRF-TOKEN', xsrfToken);
    } else {
      config.headers = {
        ...config.headers,
        'X-XSRF-TOKEN': xsrfToken,
      };
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const token = getAccessToken();
    const requestHeaders = originalRequest?.headers;
    const hadAuthHeader = Boolean(
      requestHeaders?.Authorization ||
      requestHeaders?.authorization ||
      (typeof requestHeaders?.get === 'function' && requestHeaders.get('Authorization')),
    );

    if (
      error.response?.status === 401 &&
      token &&
      hadAuthHeader &&
      !originalRequest?._retry &&
      !originalRequest?.skipAuthRefresh
    ) {
      originalRequest._retry = true;

      try {
        const nextToken = await performRefresh();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        broadcastLogout();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && token && hadAuthHeader && !originalRequest?.skipAuthClear) {
      broadcastLogout();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
