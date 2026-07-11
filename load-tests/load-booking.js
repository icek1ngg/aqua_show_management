import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

/*
 * AquaPulse Create Booking API load test.
 *
 * PowerShell example:
 * $env:ACCESS_TOKEN="paste-token-here"
 * k6 run load-tests/load-booking.js
 *
 * Optional override:
 * $env:BASE_URL="http://localhost:8080/api"
 * $env:SCHEDULE_ID="sch_symphony_lights_8pm"
 * $env:TICKET_TYPE="Standard Entry"
 * $env:QUANTITY="1"
 * k6 run load-tests/load-booking.js
 */

const accessToken = __ENV.ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('ACCESS_TOKEN is required. Set it before running: $env:ACCESS_TOKEN="paste-token-here"');}

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080/api';
const showId = __ENV.SHOW_ID || 'show_symphony_lights';
const scheduleId = __ENV.SCHEDULE_ID || 'sch_symphony_lights_8pm';
const showName = __ENV.SHOW_NAME || 'Symphony of Lights';
const showDate = __ENV.SHOW_DATE || '2026-06-01';
const ticketType = __ENV.TICKET_TYPE || 'Standard Entry';
const quantity = Number.parseInt(__ENV.QUANTITY || '1', 10);

export const processingCount = new Counter('processing_count');
export const conflictCount = new Counter('conflict_count');
export const serverErrorCount = new Counter('server_error_count');
export const unexpectedStatusCount = new Counter('unexpected_status_count');

export const options = {
  scenarios: {
    create_booking_constant_rate: {
      executor: 'constant-arrival-rate',
      rate: 1000,            // tăng từ 1000 → 5000 req/s
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 500,  // tăng từ 500 → 2500
      maxVUs: 2000,          // tăng từ 2000 → 10000
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<3000'],
    server_error_count: ['count==0'],
  },
};

http.setResponseCallback(http.expectedStatuses(200, 201, 202, 409));

export default function createBookingLoadTest() {
  const payload = JSON.stringify({
    showId,
    scheduleId,
    showName,
    showDate,
    ticketType,
    quantity,
  });

  const response = http.post(`${baseUrl}/bookings`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    tags: {
      endpoint: 'create_booking',
      scheduleId,
      ticketType,
    },
  });

  if ([200, 201, 202].includes(response.status)) {
    processingCount.add(1);
  }

  if (response.status === 409) {
    conflictCount.add(1);
  }

  if (response.status >= 500) {
    serverErrorCount.add(1);
  }

  if (![200, 201, 202, 409].includes(response.status)) {
    unexpectedStatusCount.add(1);
  }

  check(response, {
    'expected status is 200, 201, 202, or 409': (res) => [200, 201, 202, 409].includes(res.status),
    'no server error': (res) => res.status < 500,
    'response time under 3000ms': (res) => res.timings.duration < 3000,
  });
}

export function handleSummary(data) {
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const processed = data.metrics.processing_count?.values?.count || 0;
  const conflicts = data.metrics.conflict_count?.values?.count || 0;
  const serverErrors = data.metrics.server_error_count?.values?.count || 0;
  const unexpectedStatuses = data.metrics.unexpected_status_count?.values?.count || 0;

  const note = [
    '',
    'AquaPulse Create Booking load test summary:',
    `- Total requests: ${totalRequests}`,
    `- Processing/success responses (200/201/202): ${processed}`,
    `- Expected 409 conflicts: ${conflicts}`,
    `- Server errors: ${serverErrors}`,
    `- Unexpected statuses: ${unexpectedStatuses}`,
    '',
    'AquaPulse Create Booking load test notes:',
    '- 409 is expected when Redis inventory is exhausted and is not counted as http_req_failed.',
    '- With temporary inventory 100 and quantity 1, only about 100 holds should succeed for the same scheduleId/ticketType.',
    '- Remaining valid requests should return 409 Not enough tickets available.',
    '- A successful race-condition test means Redis held count and PostgreSQL booking count do not exceed inventory.',
    '- Successful requests persist PENDING_PAYMENT bookings synchronously after the Redis hold.',
    '',
  ].join('\n');

  return {
    stdout: `${JSON.stringify(data.metrics, null, 2)}\n${note}`,
  };
}

/*
 * Verification commands after the load test:
 *
 * Redis:
 * KEYS booking:*
 * GET booking:held:sch_symphony_lights_8pm:STANDARD
 * HGETALL booking:hold:<holdId>
 * TTL booking:hold:<holdId>
 *
 * PostgreSQL:
 * select count(*)
 * from bookings
 * where schedule_id = 'sch_symphony_lights_8pm'
 *   and ticket_type = 'STANDARD'
 *   and status = 'PENDING_PAYMENT';
 */
