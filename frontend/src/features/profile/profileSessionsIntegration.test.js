import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const profileSource = fs.readFileSync(new URL('./ProfilePage.jsx', import.meta.url), 'utf8');
const sessionsSource = fs.readFileSync(new URL('./SessionsPage.jsx', import.meta.url), 'utf8');
const routerSource = fs.readFileSync(new URL('../../app/router.jsx', import.meta.url), 'utf8');

test('profile embeds the active sessions panel instead of the detailed account info card', () => {
  assert.match(profileSource, /import ActiveSessionsPanel from ['"]\.\/SessionsPage\.jsx['"]/);
  assert.match(profileSource, /<ActiveSessionsPanel\s*\/>/);
  assert.equal(profileSource.includes('Account Info'), false);
  assert.equal(profileSource.includes('aria-label="Edit profile"'), false);
  assert.match(sessionsSource, /export default function ActiveSessionsPanel/);
});

test('legacy sessions route redirects to the consolidated profile page', () => {
  assert.match(routerSource, /path:\s*['"]profile\/sessions['"]/);
  assert.match(routerSource, /<Navigate replace to=['"]\/profile['"]\s*\/>/);
  assert.equal(routerSource.includes("import SessionsPage from '../features/profile/SessionsPage.jsx'"), false);
});
