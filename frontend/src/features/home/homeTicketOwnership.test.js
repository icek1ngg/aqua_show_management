import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./HomePage.jsx', import.meta.url), 'utf8');

test('Home does not import or render the ticket workspace', () => {
  assert.equal(source.includes('ShowTicketWorkspace'), false);
  assert.equal(source.includes('createTicketWorkspaceResolution'), false);
  assert.equal(source.includes('<ShowTicketWorkspace'), false);
});

test('Home show cards navigate booking to show detail', () => {
  assert.match(source, /showTicketTarget\(\{\s*showId:/);
});
