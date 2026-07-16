import { describe, it, beforeEach, mock } from 'node:test';
import { strict as assert } from 'node:assert';

import apiClient from '../../lib/apiClient.js';
import * as refreshCoordinator from './authRefreshCoordinator.js';
import { getAccessToken, clearAccessToken } from './authTokenStore.js';

const { performRefresh, clearRefreshTimer } = refreshCoordinator;

function createMemoryTokenStore() {
  let accessToken = null;
  let expiresAt = null;
  return {
    clearAccessToken() {
      accessToken = null;
      expiresAt = null;
    },
    getAccessToken: () => accessToken,
    getExpiresAt: () => expiresAt,
    setAccessToken(token, nextExpiresAt) {
      accessToken = token;
      expiresAt = nextExpiresAt;
    }
  };
}

async function waitFor(condition, timeoutMs = 250) {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() >= deadline) {
      assert.fail('Timed out waiting for test condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}

function createSharedStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
    snapshot: () => Object.fromEntries(values)
  };
}

function createBroadcastBus() {
  const channels = new Set();
  return {
    open() {
      const listeners = new Set();
      const channel = {
        addEventListener(type, listener) {
          if (type === 'message') listeners.add(listener);
        },
        close() {
          channels.delete(channel);
          listeners.clear();
        },
        postMessage(data) {
          for (const other of channels) {
            if (other === channel) continue;
            queueMicrotask(() => other.emit(data));
          }
        },
        removeEventListener(type, listener) {
          if (type === 'message') listeners.delete(listener);
        },
        emit(data) {
          for (const listener of listeners) listener({ data });
        }
      };
      channels.add(channel);
      return channel;
    }
  };
}

function createBufferedBroadcastBus() {
  const channels = new Set();
  const messages = [];
  return {
    flush() {
      for (const { data, sender } of messages.splice(0)) {
        for (const channel of channels) {
          if (channel !== sender) channel.emit(data);
        }
      }
    },
    open() {
      const listeners = new Set();
      const channel = {
        addEventListener(type, listener) {
          if (type === 'message') listeners.add(listener);
        },
        close() {
          channels.delete(channel);
          listeners.clear();
        },
        emit(data) {
          for (const listener of listeners) listener({ data });
        },
        postMessage(data) {
          messages.push({ data, sender: channel });
        },
        removeEventListener(type, listener) {
          if (type === 'message') listeners.delete(listener);
        }
      };
      channels.add(channel);
      return channel;
    }
  };
}

function createWebLockManager({ unavailableDelayMs = 0 } = {}) {
  let held = false;
  return {
    request(name, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (options?.ifAvailable && held) {
        return new Promise((resolve, reject) => {
          setTimeout(() => Promise.resolve(callback(null)).then(resolve, reject), unavailableDelayMs);
        });
      }
      held = true;
      return Promise.resolve(callback({ name })).finally(() => {
        held = false;
      });
    }
  };
}

describe('authRefreshCoordinator', () => {
  beforeEach(() => {
    if (apiClient.post.mock) {
      apiClient.post.mock.resetCalls();
    } else {
      mock.method(apiClient, 'post');
    }
    clearRefreshTimer();
    clearAccessToken();
  });

  it('should refresh token and update store', async () => {
    apiClient.post.mock.mockImplementation(async () => {
      return {
        data: {
          accessToken: 'new-token',
          expiresIn: 3600
        }
      };
    });

    const token = await performRefresh();
    assert.equal(token, 'new-token');
    assert.equal(getAccessToken(), 'new-token');
  });

  it('should handle refresh failure', async () => {
    apiClient.post.mock.mockImplementation(async () => {
      throw new Error('Unauthorized');
    });

    await assert.rejects(performRefresh(), /Unauthorized/);
    assert.equal(getAccessToken(), null);
  });

  it('allows only one fallback tab to refresh and shares the result', async (t) => {
    assert.equal(typeof refreshCoordinator.createAuthRefreshCoordinator, 'function');

    const storage = createSharedStorage();
    const bus = createBroadcastBus();
    const firstStore = createMemoryTokenStore();
    const secondStore = createMemoryTokenStore();
    let releaseRefresh;
    let refreshCalls = 0;
    const refreshAccessToken = () => {
      refreshCalls += 1;
      return new Promise((resolve) => {
        releaseRefresh = () => resolve({ data: { accessToken: 'shared-token', expiresIn: 3600 } });
      });
    };

    const firstTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(),
      refreshAccessToken,
      storage,
      tabId: 'first-tab',
      tokenStore: firstStore
    });
    const secondTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(),
      refreshAccessToken,
      storage,
      tabId: 'second-tab',
      tokenStore: secondStore
    });
    t.after(() => {
      firstTab.dispose();
      secondTab.dispose();
    });

    const first = firstTab.performRefresh();
    const second = secondTab.performRefresh();
    await waitFor(() => refreshCalls === 1);

    assert.equal(refreshCalls, 1);
    const [leaseValue] = Object.values(storage.snapshot());
    assert.deepEqual(Object.keys(JSON.parse(leaseValue)).sort(), ['expiresAt', 'ownerId']);
    releaseRefresh();
    assert.deepEqual(await Promise.all([first, second]), ['shared-token', 'shared-token']);
    assert.equal(firstStore.getAccessToken(), 'shared-token');
    assert.equal(secondStore.getAccessToken(), 'shared-token');
    assert.deepEqual(storage.snapshot(), {});
  });

  it('arbitrates fallback contenders before starting the network refresh', async (t) => {
    const storage = createSharedStorage();
    const bus = createBroadcastBus();
    let refreshCalls = 0;
    const refreshAccessToken = async () => {
      refreshCalls += 1;
      return { data: { accessToken: 'arbitrated-token', expiresIn: 3600 } };
    };
    const firstTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), refreshAccessToken, storage, tabId: 'first-tab', tokenStore: createMemoryTokenStore()
    });
    const secondTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), refreshAccessToken, storage, tabId: 'second-tab', tokenStore: createMemoryTokenStore()
    });
    t.after(() => {
      firstTab.dispose();
      secondTab.dispose();
    });

    const first = firstTab.performRefresh();
    const second = secondTab.performRefresh();

    assert.equal(refreshCalls, 0);
    assert.deepEqual(await Promise.all([first, second]), ['arbitrated-token', 'arbitrated-token']);
    assert.equal(refreshCalls, 1);
  });

  it('takes over an abandoned fallback lease after its TTL', async (t) => {
    const storage = createSharedStorage();
    storage.setItem('auth:refresh_lease', JSON.stringify({
      ownerId: 'closed-tab',
      expiresAt: Date.now() + 20
    }));
    const tokenStore = createMemoryTokenStore();
    let refreshCalls = 0;
    const coordinator = refreshCoordinator.createAuthRefreshCoordinator({
      leaseTtlMs: 50,
      pollIntervalMs: 5,
      refreshAccessToken: async () => {
        refreshCalls += 1;
        return { data: { accessToken: 'recovered-token', expiresIn: 3600 } };
      },
      storage,
      tabId: 'recovery-tab',
      tokenStore,
      waitTimeoutMs: 200
    });
    t.after(() => coordinator.dispose());

    assert.equal(await coordinator.performRefresh(), 'recovered-token');
    assert.equal(refreshCalls, 1);
    assert.deepEqual(storage.snapshot(), {});
  });

  it('renews a fallback lease while a slow refresh is still running', async (t) => {
    const storage = createSharedStorage();
    const bus = createBroadcastBus();
    let refreshCalls = 0;
    let releaseFirst;
    const refreshAccessToken = async () => {
      refreshCalls += 1;
      const callNumber = refreshCalls;
      if (callNumber === 1) {
        await new Promise((resolve) => {
          releaseFirst = resolve;
        });
      }
      return { data: { accessToken: `slow-token-${callNumber}`, expiresIn: 3600 } };
    };
    const firstTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), leaseTtlMs: 20, pollIntervalMs: 5,
      refreshAccessToken, storage, tabId: 'first-tab', tokenStore: createMemoryTokenStore()
    });
    const secondTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), leaseTtlMs: 20, pollIntervalMs: 5,
      refreshAccessToken, storage, tabId: 'second-tab', tokenStore: createMemoryTokenStore()
    });
    t.after(() => {
      firstTab.dispose();
      secondTab.dispose();
    });

    const first = firstTab.performRefresh();
    const second = secondTab.performRefresh();
    await new Promise((resolve) => setTimeout(resolve, 55));

    assert.equal(refreshCalls, 1);
    releaseFirst();
    assert.deepEqual(await Promise.all([first, second]), ['slow-token-1', 'slow-token-1']);
  });

  it('times out without calling refresh while another fallback lease stays active', async (t) => {
    const storage = createSharedStorage();
    storage.setItem('auth:refresh_lease', JSON.stringify({
      ownerId: 'stuck-tab',
      expiresAt: Date.now() + 1000
    }));
    let refreshCalls = 0;
    const coordinator = refreshCoordinator.createAuthRefreshCoordinator({
      pollIntervalMs: 5,
      refreshAccessToken: async () => {
        refreshCalls += 1;
        return { data: { accessToken: 'unexpected-token', expiresIn: 3600 } };
      },
      storage,
      tabId: 'waiting-tab',
      tokenStore: createMemoryTokenStore(),
      waitTimeoutMs: 20
    });
    t.after(() => coordinator.dispose());

    await assert.rejects(coordinator.performRefresh(), /Timeout waiting for refresh/);
    assert.equal(refreshCalls, 0);
  });

  it('cancels a pending fallback waiter when the coordinator is disposed', async () => {
    const storage = createSharedStorage();
    storage.setItem('auth:refresh_lease', JSON.stringify({
      ownerId: 'active-tab',
      expiresAt: Date.now() + 1000
    }));
    let refreshCalls = 0;
    const coordinator = refreshCoordinator.createAuthRefreshCoordinator({
      pollIntervalMs: 5,
      refreshAccessToken: async () => {
        refreshCalls += 1;
        return { data: { accessToken: 'unexpected-token', expiresIn: 3600 } };
      },
      storage,
      tabId: 'disposed-tab',
      tokenStore: createMemoryTokenStore(),
      waitTimeoutMs: 100
    });

    const pendingRefresh = coordinator.performRefresh();
    await new Promise((resolve) => setImmediate(resolve));
    coordinator.dispose();

    await assert.rejects(pendingRefresh, /disposed/i);
    assert.equal(refreshCalls, 0);
  });

  it('propagates a refresh failure to every waiting tab', async (t) => {
    const storage = createSharedStorage();
    const bus = createBroadcastBus();
    const firstStore = createMemoryTokenStore();
    const secondStore = createMemoryTokenStore();
    let rejectRefresh;
    let refreshCalls = 0;
    const refreshAccessToken = () => {
      refreshCalls += 1;
      return new Promise((resolve, reject) => {
        rejectRefresh = reject;
      });
    };
    const firstTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), refreshAccessToken, storage, tabId: 'first-tab', tokenStore: firstStore
    });
    const secondTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), refreshAccessToken, storage, tabId: 'second-tab', tokenStore: secondStore
    });
    t.after(() => {
      firstTab.dispose();
      secondTab.dispose();
    });

    const first = firstTab.performRefresh();
    const second = secondTab.performRefresh();
    await waitFor(() => typeof rejectRefresh === 'function');
    rejectRefresh(new Error('Unauthorized'));
    const results = await Promise.allSettled([first, second]);

    assert.equal(refreshCalls, 1);
    assert.deepEqual(results.map((result) => result.status), ['rejected', 'rejected']);
    assert.equal(firstStore.getAccessToken(), null);
    assert.equal(secondStore.getAccessToken(), null);
    assert.deepEqual(storage.snapshot(), {});
  });

  it('serializes fallback refreshes when BroadcastChannel is unavailable', async (t) => {
    const storage = createSharedStorage();
    let activeCalls = 0;
    let maxActiveCalls = 0;
    let refreshCalls = 0;
    let releaseFirst;
    const refreshAccessToken = async () => {
      refreshCalls += 1;
      const callNumber = refreshCalls;
      activeCalls += 1;
      maxActiveCalls = Math.max(maxActiveCalls, activeCalls);
      try {
        if (callNumber === 1) {
          await new Promise((resolve) => {
            releaseFirst = resolve;
          });
        }
        return { data: { accessToken: `token-${callNumber}`, expiresIn: 3600 } };
      } finally {
        activeCalls -= 1;
      }
    };
    const firstTab = refreshCoordinator.createAuthRefreshCoordinator({
      refreshAccessToken, storage, tabId: 'first-tab', tokenStore: createMemoryTokenStore()
    });
    const secondTab = refreshCoordinator.createAuthRefreshCoordinator({
      refreshAccessToken, storage, tabId: 'second-tab', tokenStore: createMemoryTokenStore()
    });
    t.after(() => {
      firstTab.dispose();
      secondTab.dispose();
    });

    const first = firstTab.performRefresh();
    const second = secondTab.performRefresh();
    await waitFor(() => refreshCalls === 1);
    assert.equal(refreshCalls, 1);
    releaseFirst();

    assert.deepEqual(await Promise.all([first, second]), ['token-1', 'token-2']);
    assert.equal(refreshCalls, 2);
    assert.equal(maxActiveCalls, 1);
    assert.deepEqual(storage.snapshot(), {});
  });

  it('waits for the Web Locks winner instead of rotating again', async (t) => {
    const bus = createBufferedBroadcastBus();
    const locks = createWebLockManager();
    let refreshCalls = 0;
    let releaseRefresh;
    const refreshAccessToken = async () => {
      refreshCalls += 1;
      const callNumber = refreshCalls;
      if (callNumber === 1) {
        await new Promise((resolve) => {
          releaseRefresh = resolve;
        });
      }
      return { data: { accessToken: `web-lock-token-${callNumber}`, expiresIn: 3600 } };
    };
    const firstTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), leaseTtlMs: 50, locks, refreshAccessToken, tokenStore: createMemoryTokenStore()
    });
    const secondTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), leaseTtlMs: 50, locks, refreshAccessToken, tokenStore: createMemoryTokenStore()
    });
    t.after(() => {
      firstTab.dispose();
      secondTab.dispose();
    });

    const first = firstTab.performRefresh();
    const second = secondTab.performRefresh();
    await waitFor(() => typeof releaseRefresh === 'function');
    releaseRefresh();
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(refreshCalls, 1);
    bus.flush();
    assert.deepEqual(await Promise.all([first, second]), ['web-lock-token-1', 'web-lock-token-1']);
  });

  it('does not combine signal with ifAvailable in a Web Locks request', async (t) => {
    const locks = {
      request(name, options, callback) {
        if (options?.signal && options?.ifAvailable) {
          throw new TypeError("The 'signal' and 'ifAvailable' options cannot be used together.");
        }
        return Promise.resolve(callback({ name }));
      }
    };
    const coordinator = refreshCoordinator.createAuthRefreshCoordinator({
      channel: createBroadcastBus().open(),
      locks,
      refreshAccessToken: async () => ({
        data: { accessToken: 'browser-compatible-token', expiresIn: 3600 }
      }),
      tokenStore: createMemoryTokenStore()
    });
    t.after(() => coordinator.dispose());

    assert.equal(await coordinator.performRefresh(), 'browser-compatible-token');
  });

  it('uses a Web Locks result broadcast before the loser callback is installed', async (t) => {
    const bus = createBroadcastBus();
    const locks = createWebLockManager({ unavailableDelayMs: 15 });
    let refreshCalls = 0;
    const refreshAccessToken = async () => {
      refreshCalls += 1;
      return { data: { accessToken: `early-token-${refreshCalls}`, expiresIn: 3600 } };
    };
    const firstTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), leaseTtlMs: 20, locks, refreshAccessToken, tokenStore: createMemoryTokenStore()
    });
    const secondTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), leaseTtlMs: 20, locks, refreshAccessToken, tokenStore: createMemoryTokenStore()
    });
    t.after(() => {
      firstTab.dispose();
      secondTab.dispose();
    });

    const results = await Promise.all([firstTab.performRefresh(), secondTab.performRefresh()]);

    assert.deepEqual(results, ['early-token-1', 'early-token-1']);
    assert.equal(refreshCalls, 1);
  });

  it('lets a late-joining tab reuse a peer token without rotating again', async (t) => {
    const bus = createBroadcastBus();
    const locks = createWebLockManager();
    let refreshCalls = 0;
    const refreshAccessToken = async () => {
      refreshCalls += 1;
      return { data: { accessToken: `late-peer-token-${refreshCalls}`, expiresIn: 3600 } };
    };
    const firstTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), locks, refreshAccessToken, tokenStore: createMemoryTokenStore()
    });
    t.after(() => firstTab.dispose());

    assert.equal(await firstTab.performRefresh(), 'late-peer-token-1');

    const secondTab = refreshCoordinator.createAuthRefreshCoordinator({
      channel: bus.open(), locks, refreshAccessToken, tokenStore: createMemoryTokenStore()
    });
    t.after(() => secondTab.dispose());

    assert.equal(await secondTab.performRefresh(), 'late-peer-token-1');
    assert.equal(refreshCalls, 1);
  });
});
