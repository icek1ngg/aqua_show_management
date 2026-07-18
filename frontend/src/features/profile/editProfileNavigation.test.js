import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const editProfileSource = readFileSync(new URL('./EditProfilePage.jsx', import.meta.url), 'utf8');

test('edit profile keeps Cancel as the only textual return action', () => {
  assert.doesNotMatch(editProfileSource, /Back to Profile/);
  assert.match(editProfileSource, />\s*Cancel\s*</);
});
