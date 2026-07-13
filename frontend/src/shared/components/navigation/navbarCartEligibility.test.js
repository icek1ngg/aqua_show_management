import test from 'node:test';
import assert from 'node:assert/strict';

import { canShowUserCart } from './navbarCartEligibility.js';

const navigationSurfaces = ['desktop', 'mobile'];

for (const surface of navigationSurfaces) {
  test(`${surface} cart is visible to guests and regular users after auth loads`, () => {
    assert.equal(canShowUserCart(null, false), true);
    assert.equal(canShowUserCart({ role: 'USER' }, false), true);
    assert.equal(canShowUserCart({ roles: ['ROLE_USER'] }, false), true);
  });

  test(`${surface} cart is hidden while auth loads and for every privileged role`, () => {
    assert.equal(canShowUserCart(null, true), false);
    assert.equal(canShowUserCart({ role: 'STAFF' }, false), false);
    assert.equal(canShowUserCart({ role: 'ROLE_MANAGER' }, false), false);
    assert.equal(canShowUserCart({ roles: ['ADMIN'] }, false), false);
  });
}
