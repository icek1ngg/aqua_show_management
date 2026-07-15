import { getAccessToken, getExpiresAt, setAccessToken, clearAccessToken } from './authTokenStore.js';
import * as authService from '../../services/authService.js';
import { getTokenExpiresAt } from './jwtPayload.js';

let refreshTimer = null;
let activeRefreshPromise = null;

const REFRESH_CHANNEL_NAME = 'auth:refresh_channel';
let refreshChannel = null;

if (typeof window !== 'undefined' && window.BroadcastChannel) {
  refreshChannel = new BroadcastChannel(REFRESH_CHANNEL_NAME);
  refreshChannel.addEventListener('message', (event) => {
    if (event.data?.type === 'REFRESH_SUCCESS') {
      const { accessToken, expiresAt } = event.data;
      setAccessToken(accessToken, expiresAt);
      scheduleRefresh();
      window.dispatchEvent(new Event('auth:token-updated'));
    } else if (event.data?.type === 'LOGOUT') {
      clearAuth();
    }
  });
}

function clearAuth() {
  clearAccessToken();
  clearRefreshTimer();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:token-cleared'));
  }
}

export function broadcastLogout() {
  clearAuth();
  if (refreshChannel) {
    refreshChannel.postMessage({ type: 'LOGOUT' });
  }
}

export function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export function scheduleRefresh() {
  clearRefreshTimer();
  
  const expiresAt = getExpiresAt();
  if (!expiresAt) return;
  
  const now = Date.now();
  // Refresh 45 seconds before expiration
  const timeUntilRefresh = Math.max(0, expiresAt - now - 45000);
  
  refreshTimer = setTimeout(() => {
    performRefresh();
  }, timeUntilRefresh);
}

function performRefreshInternal() {
  return authService.refreshAccessToken()
    .then((response) => {
       const data = response?.data ?? response;
       const accessToken = data?.accessToken || data?.token || data?.jwt || data?.access_token;
       if (!accessToken) throw new Error("No token returned");
       
       const nextExpiresAt = getTokenExpiresAt(accessToken, data?.expiresAt, data?.expiresIn);
       
       setAccessToken(accessToken, nextExpiresAt);
       scheduleRefresh();
       if (typeof window !== 'undefined') {
         window.dispatchEvent(new Event('auth:token-updated'));
       }
       
       if (refreshChannel) {
         refreshChannel.postMessage({
           type: 'REFRESH_SUCCESS',
           accessToken,
           expiresAt: nextExpiresAt
         });
       }
       return accessToken;
    })
    .catch((error) => {
       clearAuth();
       if (refreshChannel) {
         refreshChannel.postMessage({ type: 'LOGOUT' }); // Notify other tabs that refresh failed
       }
       throw error;
    });
}

export function performRefresh() {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }
  
  if (typeof navigator !== 'undefined' && navigator.locks) {
    activeRefreshPromise = navigator.locks.request('aquapulse-auth-refresh', { ifAvailable: true }, (lock) => {
      if (lock) {
        // We got the lock, we do the refresh
        return performRefreshInternal();
      } else {
        // Someone else is refreshing, wait for broadcast
        return new Promise((resolve, reject) => {
          let timeout;
          const handler = (event) => {
            if (event.data?.type === 'REFRESH_SUCCESS') {
              cleanup();
              resolve(event.data.accessToken);
            } else if (event.data?.type === 'LOGOUT') {
              cleanup();
              reject(new Error("Refresh failed in another tab"));
            }
          };
          
          const cleanup = () => {
             if (refreshChannel) refreshChannel.removeEventListener('message', handler);
             clearTimeout(timeout);
          };
          
          timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Timeout waiting for refresh from another tab"));
          }, 10000); // 10s wait
          
          if (refreshChannel) refreshChannel.addEventListener('message', handler);
          else reject(new Error("No refresh channel available"));
        });
      }
    }).finally(() => {
       activeRefreshPromise = null;
    });
    return activeRefreshPromise;
  } else {
    // Fallback without Web Locks API
    activeRefreshPromise = performRefreshInternal().finally(() => {
      activeRefreshPromise = null;
    });
    return activeRefreshPromise;
  }
}
