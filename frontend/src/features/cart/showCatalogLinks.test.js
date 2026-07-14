import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  '../../shared/components/navigation/Footer.jsx',
  '../profile/ProfilePage.jsx',
  '../booking/CreateBookingPage.jsx',
  '../booking/BookingHistoryPage.jsx',
  '../../stitch-react/ShowDetailPage.jsx',
];

test('generic booking links do not target the removed standalone shows page', () => {
  for (const relativePath of files) {
    const source = fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    assert.equal(source.includes('to="/shows"'), false, relativePath);
    assert.equal(source.includes("to: '/shows'"), false, relativePath);
  }
});
