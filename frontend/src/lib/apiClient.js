import axios from 'axios';

import { clearStoredToken, getAccessToken, getTokenExpiresAt, storeToken } from '../features/auth/authStorage.js';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
let refreshAccessTokenPromise = null;

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

function getResponseData(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getAccessTokenFromResponse(response) {
  const data = getResponseData(response);
  return (
    response?.data?.data?.accessToken ||
    response?.data?.accessToken ||
    data?.accessToken ||
    null
  );
}

function getUserFromResponse(response) {
  const data = getResponseData(response);
  return response?.data?.data?.user || response?.data?.user || data?.user || null;
}

async function refreshAccessToken() {
  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = apiClient
      .post('/auth/refresh', null, {
        skipAuthClear: true,
        skipAuthRefresh: true,
      })
      .then((response) => {
        const accessToken = getAccessTokenFromResponse(response);
        if (!accessToken) {
          throw new Error('Refresh succeeded but no access token was returned.');
        }

        const data = getResponseData(response);
        storeToken({
          token: accessToken,
          expiresAt: getTokenExpiresAt(accessToken, data?.expiresAt, data?.expiresIn),
          user: getUserFromResponse(response),
        });
        return accessToken;
      })
      .finally(() => {
        refreshAccessTokenPromise = null;
      });
  }

  return refreshAccessTokenPromise;
}

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
