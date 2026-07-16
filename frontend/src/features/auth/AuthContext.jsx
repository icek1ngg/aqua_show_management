import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authService from '../../services/authService.js';
import { decodeJwtPayload, getTokenExpiresAt } from './jwtPayload.js';
import { getAccessToken, setAccessToken, clearAccessToken } from './authTokenStore.js';
import { performRefresh, broadcastLogout, scheduleRefresh } from './authRefreshCoordinator.js';

const AuthContext = createContext(null);

function getResponseData(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getTokenFromLoginResponse(response) {
  const data = getResponseData(response);
  return (
    response?.data?.data?.accessToken ||
    response?.data?.accessToken ||
    response?.data?.token ||
    response?.data?.jwt ||
    response?.data?.access_token ||
    data?.accessToken ||
    data?.token ||
    data?.jwt ||
    data?.access_token ||
    null
  );
}

function getUserFromResponse(response) {
  const data = getResponseData(response);
  return (
    response?.data?.data?.user ||
    response?.data?.user ||
    response?.data?.account ||
    response?.data?.profile ||
    data?.user ||
    data?.account ||
    data?.profile ||
    null
  );
}

function getUserFromToken(token) {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return {
      name: 'AquaPulse Guest',
      email: '',
      avatarUrl: '',
    };
  }

  const role = payload.role || payload.userRole || '';
  const payloadRoles = payload.roles || payload.authorities || [];
  const roles = Array.isArray(payloadRoles) ? payloadRoles : [payloadRoles];
  const normalizedRoles = [...new Set([role, ...roles].filter(Boolean).map((item) => String(item).replace(/^ROLE_/, '')))];

  return {
    name: payload.name || payload.fullName || payload.username || payload.email || 'AquaPulse Guest',
    email: payload.email || '',
    avatarUrl: payload.avatarUrl || payload.picture || '',
    role,
    roles: normalizedRoles,
  };
}

function getErrorMessage(error, fallback) {
  const validationErrors = error.response?.data?.errors;

  if (validationErrors && typeof validationErrors === 'object') {
    const firstMessage = Object.values(validationErrors).find(Boolean);
    if (firstMessage) {
      return firstMessage;
    }
  }

  return error.response?.data?.message || error.response?.data?.error || error.message || fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Local logout must always complete even if the backend endpoint is unavailable.
    } finally {
      broadcastLogout();
      setToken(null);
      setUser(null);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const nextUser = getUserFromResponse(currentUser) || getResponseData(currentUser) || getUserFromToken(getAccessToken());
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error.response?.status === 401) {
        broadcastLogout();
        setUser(null);
        setToken(null);
        return null;
      }

      const fallbackUser = getUserFromToken(getAccessToken());
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function restoreAuthState() {
      try {
        const refreshedToken = await performRefresh();
        if (!refreshedToken) {
          if (!ignore) {
            setToken(null);
            setUser(null);
          }
          return;
        }

        if (!ignore) {
          setToken(refreshedToken);
          setUser(getUserFromToken(refreshedToken));
        }

        // Load profile
        try {
          const currentUser = await authService.getCurrentUser();
          if (!ignore) {
            const nextUser = getUserFromResponse(currentUser) || getResponseData(currentUser) || getUserFromToken(refreshedToken);
            setUser(nextUser);
          }
        } catch (error) {
          if (!ignore) {
            if (error.response?.status === 401) {
              broadcastLogout();
              setToken(null);
              setUser(null);
            } else {
              setUser(getUserFromToken(refreshedToken));
            }
          }
        }
      } catch {
        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    restoreAuthState();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const handleTokenCleared = () => {
      setToken(null);
      setUser(null);
    };
    const handleTokenUpdated = () => {
      const currentToken = getAccessToken();
      setToken(currentToken);

      // If we got a token update from another tab, we might want to fetch user,
      // but decoding the token is usually enough until next reload.
      if (currentToken) {
        setUser((prevUser) => prevUser || getUserFromToken(currentToken));
      }
    };

    window.addEventListener('auth:token-cleared', handleTokenCleared);
    window.addEventListener('auth:token-updated', handleTokenUpdated);
    return () => {
      window.removeEventListener('auth:token-cleared', handleTokenCleared);
      window.removeEventListener('auth:token-updated', handleTokenUpdated);
    };
  }, []);

  const login = useCallback(async (credentials, rememberMe = false) => {
    try {
      const response = await authService.login({ ...credentials, rememberMe });
      const nextToken = getTokenFromLoginResponse(response);

      if (!nextToken) {
        throw new Error('Login succeeded but no access token was returned.');
      }

      const responseData = getResponseData(response);
      const expiresAt = getTokenExpiresAt(nextToken, responseData?.expiresAt, responseData?.expiresIn);
      const nextUser = getUserFromResponse(response) || getUserFromToken(nextToken);

      setAccessToken(nextToken, expiresAt);
      scheduleRefresh();

      setToken(nextToken);
      setUser(nextUser);

      return { user: nextUser, token: nextToken };
    } catch (error) {
      const nextError = new Error(getErrorMessage(error, 'Login failed. Please check your credentials and try again.'));
      nextError.code = error.response?.data?.code || '';
      throw nextError;
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      return await authService.register(payload);
    } catch (error) {
      const nextError = new Error(getErrorMessage(error, 'Registration failed. Please review your details and try again.'));
      nextError.code = error.response?.data?.code || '';
      throw nextError;
    }
  }, []);

  const completeOAuthConsent = useCallback(async (code, acceptedTerms, legalDocumentVersion) => {
    try {
      const response = await authService.completeOAuth({ code, acceptedTerms, legalDocumentVersion });
      const nextToken = getTokenFromLoginResponse(response);

      if (!nextToken) {
        throw new Error('OAuth completion succeeded but no access token was returned.');
      }

      const responseData = getResponseData(response);
      const expiresAt = getTokenExpiresAt(nextToken, responseData?.expiresAt, responseData?.expiresIn);
      const tokenUser = getUserFromResponse(response) || getUserFromToken(nextToken);

      setAccessToken(nextToken, expiresAt);
      scheduleRefresh();

      setToken(nextToken);
      setUser(tokenUser);

      return tokenUser;
    } catch (error) {
      broadcastLogout();
      setToken(null);
      setUser(null);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      refreshCurrentUser,
      completeOAuthConsent,
    }),
    [loading, login, logout, refreshCurrentUser, register, token, user, completeOAuthConsent],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
