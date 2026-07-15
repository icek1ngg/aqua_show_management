import axios from 'axios';

import { getAccessToken, clearAccessToken } from '../features/auth/authTokenStore.js';
import { performRefresh, broadcastLogout } from '../features/auth/authRefreshCoordinator.js';
import {
  getCsrfToken,
  isCsrfProtectedRequest,
  setCsrfToken,
} from '../features/auth/csrfTokenStore.js';

const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

const csrfBootstrapClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

let activeCsrfBootstrap = null;

async function ensureCsrfToken() {
  const existingToken = getCsrfToken();
  if (existingToken) {
    return existingToken;
  }

  if (!activeCsrfBootstrap) {
    activeCsrfBootstrap = csrfBootstrapClient.get('/auth/csrf')
      .then((response) => {
        const token = response?.data?.data?.token;
        if (!token) {
          throw new Error('CSRF bootstrap succeeded without a token.');
        }
        setCsrfToken(token);
        return token;
      })
      .finally(() => {
        activeCsrfBootstrap = null;
      });
  }

  return activeCsrfBootstrap;
}

apiClient.interceptors.request.use(async (config) => {
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

  if (isCsrfProtectedRequest(config.url, config.method)) {
    const xsrfToken = await ensureCsrfToken();
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
