import { describe, it, beforeEach, mock } from 'node:test';
import { strict as assert } from 'node:assert';

import apiClient from '../../lib/apiClient.js';
import { performRefresh, clearRefreshTimer } from './authRefreshCoordinator.js';
import { getAccessToken, clearAccessToken } from './authTokenStore.js';

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
});
