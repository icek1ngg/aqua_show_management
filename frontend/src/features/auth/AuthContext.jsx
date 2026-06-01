import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authService from '../../services/authService.js';
import {
  clearStoredToken,
  decodeJwtPayload,
  getStoredToken,
  getTokenExpiresAt,
  storeToken,
} from './authStorage.js';

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
      clearStoredToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const storedToken = getStoredToken();

    if (!storedToken?.token) {
      setUser(null);
      setToken(null);
      return null;
    }

    setToken(storedToken.token);

    try {
      const currentUser = await authService.getCurrentUser();
      const nextUser = getUserFromResponse(currentUser) || getResponseData(currentUser) || getUserFromToken(storedToken.token);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error.response?.status === 401) {
        clearStoredToken();
        setUser(null);
        setToken(null);
        return null;
      }

      const fallbackUser = getUserFromToken(storedToken.token);
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function restoreAuthState() {
      const storedToken = getStoredToken();

      if (!storedToken?.token) {
        if (!ignore) {
          setLoading(false);
        }
        return;
      }

      setToken(storedToken.token);

      try {
        const currentUser = await authService.getCurrentUser();
        if (!ignore) {
          setUser(getUserFromResponse(currentUser) || getResponseData(currentUser) || getUserFromToken(storedToken.token));
        }
      } catch (error) {
        if (!ignore) {
          if (error.response?.status === 401) {
            clearStoredToken();
            setToken(null);
            setUser(null);
          } else {
            setUser(getUserFromToken(storedToken.token));
          }
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

    window.addEventListener('auth:token-cleared', handleTokenCleared);
    return () => window.removeEventListener('auth:token-cleared', handleTokenCleared);
  }, []);

  const login = useCallback(async (credentials, rememberMe = false) => {
    try {
      const response = await authService.login(credentials);
      const nextToken = getTokenFromLoginResponse(response);

      if (!nextToken) {
        throw new Error('Login succeeded but no access token was returned.');
      }

      const responseData = getResponseData(response);
      const expiresAt = getTokenExpiresAt(nextToken, responseData?.expiresAt, responseData?.expiresIn);
      const nextUser = getUserFromResponse(response) || getUserFromToken(nextToken);

      storeToken({ token: nextToken, rememberMe, expiresAt });
      setToken(nextToken);
      setUser(nextUser);

      return { user: nextUser, token: nextToken };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Login failed. Please check your credentials and try again.'));
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      return await authService.register(payload);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Registration failed. Please review your details and try again.'));
    }
  }, []);

  const completeOAuthLogin = useCallback(async (accessToken, expiresIn) => {
    try {
      const expiresAt = getTokenExpiresAt(accessToken, null, expiresIn);
      storeToken({ token: accessToken, rememberMe: false, expiresAt });
      setToken(accessToken);

      const currentUser = await authService.getCurrentUser();
      const nextUser = getUserFromResponse(currentUser) || getResponseData(currentUser) || getUserFromToken(accessToken);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      clearStoredToken();
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
      completeOAuthLogin,
    }),
    [loading, login, logout, refreshCurrentUser, register, token, user, completeOAuthLogin],
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
