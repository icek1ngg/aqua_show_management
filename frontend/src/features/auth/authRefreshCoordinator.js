import { getAccessToken, getExpiresAt, setAccessToken, clearAccessToken } from './authTokenStore.js';
import * as authService from '../../services/authService.js';
import { getTokenExpiresAt } from './jwtPayload.js';

const REFRESH_CHANNEL_NAME = 'auth:refresh_channel';
const REFRESH_LOCK_NAME = 'aquapulse-auth-refresh';
const REFRESH_LEASE_KEY = 'auth:refresh_lease';
const DEFAULT_LEASE_TTL_MS = 10000;
const DEFAULT_LEASE_ARBITRATION_MS = 12;
const DEFAULT_WAIT_TIMEOUT_MS = 15000;
const DEFAULT_POLL_INTERVAL_MS = 25;

function randomTabId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readLease(storage) {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(REFRESH_LEASE_KEY));
    if (typeof value?.ownerId !== 'string' || !Number.isFinite(value?.expiresAt)) return null;
    return value;
  } catch {
    return null;
  }
}

export function createAuthRefreshCoordinator({
  channel = null,
  clearTimeoutFn = clearTimeout,
  dispatchEvent = () => {},
  leaseArbitrationMs = DEFAULT_LEASE_ARBITRATION_MS,
  leaseTtlMs = DEFAULT_LEASE_TTL_MS,
  locks = null,
  now = () => Date.now(),
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  refreshAccessToken = authService.refreshAccessToken,
  setTimeoutFn = setTimeout,
  storage = null,
  tabId = randomTabId(),
  tokenStore = { clearAccessToken, getAccessToken, getExpiresAt, setAccessToken },
  waitTimeoutMs = DEFAULT_WAIT_TIMEOUT_MS
} = {}) {
  let activeRefreshPromise = null;
  let disposed = false;
  let leaseHeartbeatTimer = null;
  let lastPeerOutcome = null;
  let peerOutcomeSequence = 0;
  const pendingWaitCancels = new Set();
  let refreshTimer = null;
  const lockAbortController = locks?.request && typeof AbortController !== 'undefined'
    ? new AbortController()
    : null;

  function disposedError() {
    return new Error('Auth refresh coordinator has been disposed');
  }

  function ensureActive() {
    if (disposed) throw disposedError();
  }

  function clearRefreshTimer() {
    if (refreshTimer !== null) {
      clearTimeoutFn(refreshTimer);
      refreshTimer = null;
    }
  }

  function clearAuth() {
    tokenStore.clearAccessToken();
    clearRefreshTimer();
    dispatchEvent('auth:token-cleared');
  }

  function scheduleRefresh() {
    clearRefreshTimer();
    const expiresAt = tokenStore.getExpiresAt();
    if (!expiresAt) return;
    const timeUntilRefresh = Math.max(0, expiresAt - now() - 45000);
    refreshTimer = setTimeoutFn(() => {
      performRefresh().catch(() => {});
    }, timeUntilRefresh);
  }

  function acceptRefresh(accessToken, expiresAt) {
    tokenStore.setAccessToken(accessToken, expiresAt);
    scheduleRefresh();
    dispatchEvent('auth:token-updated');
  }

  function postMessage(message) {
    channel?.postMessage(message);
  }

  function onChannelMessage(event) {
    if (event.data?.type === 'TOKEN_REQUEST') {
      const accessToken = tokenStore.getAccessToken?.();
      const expiresAt = tokenStore.getExpiresAt();
      if (accessToken && expiresAt > now()) {
        postMessage({ type: 'REFRESH_SUCCESS', accessToken, expiresAt });
      }
    } else if (event.data?.type === 'REFRESH_SUCCESS') {
      lastPeerOutcome = {
        accessToken: event.data.accessToken,
        sequence: ++peerOutcomeSequence,
        type: 'success'
      };
      acceptRefresh(event.data.accessToken, event.data.expiresAt);
    } else if (event.data?.type === 'REFRESH_FAILURE' || event.data?.type === 'LOGOUT') {
      lastPeerOutcome = { sequence: ++peerOutcomeSequence, type: 'failure' };
      clearAuth();
    }
  }

  function peerOutcomeAfter(sequence) {
    return lastPeerOutcome?.sequence > sequence ? lastPeerOutcome : null;
  }

  channel?.addEventListener('message', onChannelMessage);

  async function performRefreshInternal() {
    try {
      ensureActive();
      const response = await refreshAccessToken();
      ensureActive();
      const data = response?.data ?? response;
      const accessToken = data?.accessToken || data?.token || data?.jwt || data?.access_token;
      if (!accessToken) throw new Error('No token returned');

      const expiresAt = getTokenExpiresAt(accessToken, data?.expiresAt, data?.expiresIn);
      acceptRefresh(accessToken, expiresAt);
      postMessage({ type: 'REFRESH_SUCCESS', accessToken, expiresAt });
      return accessToken;
    } catch (error) {
      if (disposed) throw error;
      clearAuth();
      postMessage({ type: 'REFRESH_FAILURE' });
      throw error;
    }
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeoutFn(resolve, milliseconds));
  }

  async function tryAcquireLease() {
    if (!storage) return true;
    const current = readLease(storage);
    if (current && current.ownerId !== tabId && current.expiresAt > now()) return false;

    const arbitrationDelay = Math.min(
      leaseArbitrationMs,
      Math.max(1, Math.floor(leaseTtlMs / 4))
    );
    await delay(arbitrationDelay);
    const latest = readLease(storage);
    if (latest && latest.ownerId !== tabId && latest.expiresAt > now()) return false;

    const lease = { ownerId: tabId, expiresAt: now() + leaseTtlMs };
    try {
      storage.setItem(REFRESH_LEASE_KEY, JSON.stringify(lease));
      await delay(arbitrationDelay);
      const confirmed = readLease(storage);
      return confirmed?.ownerId === tabId && confirmed.expiresAt > now();
    } catch {
      return true;
    }
  }

  function stopLeaseHeartbeat() {
    if (leaseHeartbeatTimer !== null) {
      clearTimeoutFn(leaseHeartbeatTimer);
      leaseHeartbeatTimer = null;
    }
  }

  function startLeaseHeartbeat() {
    if (!storage) return;
    stopLeaseHeartbeat();
    const renew = () => {
      const lease = readLease(storage);
      if (lease?.ownerId !== tabId) {
        leaseHeartbeatTimer = null;
        return;
      }
      try {
        storage.setItem(REFRESH_LEASE_KEY, JSON.stringify({
          ownerId: tabId,
          expiresAt: now() + leaseTtlMs
        }));
        leaseHeartbeatTimer = setTimeoutFn(renew, Math.max(1, Math.floor(leaseTtlMs / 2)));
      } catch {
        leaseHeartbeatTimer = null;
      }
    };
    leaseHeartbeatTimer = setTimeoutFn(renew, Math.max(1, Math.floor(leaseTtlMs / 2)));
  }

  function releaseLease() {
    stopLeaseHeartbeat();
    if (!storage) return;
    try {
      if (readLease(storage)?.ownerId === tabId) {
        storage.removeItem(REFRESH_LEASE_KEY);
      }
    } catch {
      // Storage can become unavailable while a tab is running.
    }
  }

  function waitForPeer(deadline, observedSequence) {
    return new Promise((resolve, reject) => {
      let timer = null;
      let settled = false;
      let cancel = null;

      const cleanup = () => {
        if (timer !== null) clearTimeoutFn(timer);
        channel?.removeEventListener('message', handleMessage);
        pendingWaitCancels.delete(cancel);
      };
      const finish = (callback) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };
      const handleMessage = (event) => {
        if (event.data?.type === 'REFRESH_SUCCESS') {
          finish(() => resolve({ type: 'success', token: event.data.accessToken }));
        } else if (event.data?.type === 'REFRESH_FAILURE' || event.data?.type === 'LOGOUT') {
          finish(() => reject(new Error('Refresh failed in another tab')));
        }
      };
      const checkLease = () => {
        if (now() >= deadline) {
          finish(() => reject(new Error('Timeout waiting for refresh from another tab')));
          return;
        }
        const lease = readLease(storage);
        if (!lease || lease.expiresAt <= now()) {
          finish(() => resolve({ type: 'retry' }));
          return;
        }
        timer = setTimeoutFn(checkLease, Math.min(pollIntervalMs, deadline - now()));
      };

      cancel = () => finish(() => reject(disposedError()));
      pendingWaitCancels.add(cancel);
      if (disposed) {
        cancel();
        return;
      }
      channel?.addEventListener('message', handleMessage);
      const cachedOutcome = peerOutcomeAfter(observedSequence);
      if (cachedOutcome?.type === 'success') {
        finish(() => resolve({ type: 'success', token: cachedOutcome.accessToken }));
        return;
      }
      if (cachedOutcome?.type === 'failure') {
        finish(() => reject(new Error('Refresh failed in another tab')));
        return;
      }
      checkLease();
    });
  }

  function waitForWebLockPeer(deadline, observedSequence) {
    return new Promise((resolve, reject) => {
      let timer = null;
      let settled = false;
      let cancel = null;
      const cleanup = () => {
        if (timer !== null) clearTimeoutFn(timer);
        channel?.removeEventListener('message', handleMessage);
        pendingWaitCancels.delete(cancel);
      };
      const finish = (callback) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };
      const handleMessage = (event) => {
        if (event.data?.type === 'REFRESH_SUCCESS') {
          finish(() => resolve({ type: 'success', token: event.data.accessToken }));
        } else if (event.data?.type === 'REFRESH_FAILURE' || event.data?.type === 'LOGOUT') {
          finish(() => reject(new Error('Refresh failed in another tab')));
        }
      };

      const remaining = deadline - now();
      if (remaining <= 0) {
        reject(new Error('Timeout waiting for refresh from another tab'));
        return;
      }
      cancel = () => finish(() => reject(disposedError()));
      pendingWaitCancels.add(cancel);
      if (disposed) {
        cancel();
        return;
      }
      channel.addEventListener('message', handleMessage);
      const cachedOutcome = peerOutcomeAfter(observedSequence);
      if (cachedOutcome?.type === 'success') {
        finish(() => resolve({ type: 'success', token: cachedOutcome.accessToken }));
        return;
      }
      if (cachedOutcome?.type === 'failure') {
        finish(() => reject(new Error('Refresh failed in another tab')));
        return;
      }
      timer = setTimeoutFn(() => {
        finish(() => {
          if (now() >= deadline) {
            reject(new Error('Timeout waiting for refresh from another tab'));
          } else {
            resolve({ type: 'retry' });
          }
        });
      }, Math.min(leaseTtlMs, remaining));
    });
  }

  async function performWithLease(deadline, observedSequence) {
    ensureActive();
    if (await tryAcquireLease()) {
      ensureActive();
      startLeaseHeartbeat();
      try {
        return await performRefreshInternal();
      } finally {
        releaseLease();
      }
    }

    const outcome = await waitForPeer(deadline, observedSequence);
    if (outcome.type === 'success') return outcome.token;
    return performWithLease(deadline, observedSequence);
  }

  function performWithWebLock(deadline, observedSequence) {
    ensureActive();
    const signalOptions = lockAbortController ? { signal: lockAbortController.signal } : {};
    if (!channel) {
      return locks.request(REFRESH_LOCK_NAME, signalOptions, () => performRefreshInternal());
    }
    return locks.request(REFRESH_LOCK_NAME, { ifAvailable: true }, async (lock) => {
      ensureActive();
      if (lock) return performRefreshInternal();
      const outcome = await waitForWebLockPeer(deadline, observedSequence);
      if (outcome.type === 'success') return outcome.token;
      return performWithWebLock(deadline, observedSequence);
    });
  }

  async function performWithPeerDiscovery(deadline, observedSequence) {
    postMessage({ type: 'TOKEN_REQUEST' });
    await delay(leaseArbitrationMs);
    ensureActive();
    const peerOutcome = peerOutcomeAfter(observedSequence);
    if (peerOutcome?.type === 'success') return peerOutcome.accessToken;
    if (peerOutcome?.type === 'failure') throw new Error('Refresh failed in another tab');
    return performWithWebLock(deadline, observedSequence);
  }

  function performRefresh() {
    if (disposed) return Promise.reject(disposedError());
    if (activeRefreshPromise) return activeRefreshPromise;
    const deadline = now() + waitTimeoutMs;
    const observedSequence = peerOutcomeSequence;
    const operation = locks?.request
      ? (channel
          ? performWithPeerDiscovery(deadline, observedSequence)
          : performWithWebLock(deadline, observedSequence))
      : performWithLease(deadline, observedSequence);
    activeRefreshPromise = Promise.resolve(operation).finally(() => {
      activeRefreshPromise = null;
    });
    return activeRefreshPromise;
  }

  function broadcastLogout() {
    clearAuth();
    postMessage({ type: 'LOGOUT' });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearRefreshTimer();
    stopLeaseHeartbeat();
    lockAbortController?.abort();
    for (const cancel of [...pendingWaitCancels]) cancel();
    channel?.removeEventListener('message', onChannelMessage);
    channel?.close?.();
  }

  return { broadcastLogout, clearRefreshTimer, dispose, performRefresh, scheduleRefresh };
}

function browserStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function browserChannel() {
  return typeof window !== 'undefined' && window.BroadcastChannel
    ? new window.BroadcastChannel(REFRESH_CHANNEL_NAME)
    : null;
}

const browserCoordinator = createAuthRefreshCoordinator({
  channel: browserChannel(),
  dispatchEvent: (type) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(type));
  },
  locks: typeof navigator !== 'undefined' ? navigator.locks : null,
  storage: browserStorage()
});

export const broadcastLogout = browserCoordinator.broadcastLogout;
export const clearRefreshTimer = browserCoordinator.clearRefreshTimer;
export const performRefresh = browserCoordinator.performRefresh;
export const scheduleRefresh = browserCoordinator.scheduleRefresh;
