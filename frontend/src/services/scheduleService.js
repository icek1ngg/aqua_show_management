import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getSchedules({ showId, venueId, status, fromTime, toTime, page = 0, size = 10 } = {}) {
  const response = await apiClient.get('/manager/schedules', {
    params: {
      showId: showId || undefined,
      venueId: venueId || undefined,
      status: status || undefined,
      fromTime: fromTime || undefined,
      toTime: toTime || undefined,
      page,
      size,
    },
  });
  return unwrap(response);
}

export async function getScheduleDetail(id) {
  const response = await apiClient.get(`/manager/schedules/${id}`);
  return unwrap(response);
}

export async function createSchedule(payload) {
  const response = await apiClient.post('/manager/schedules', payload);
  return unwrap(response);
}

export async function updateSchedule(id, payload) {
  const response = await apiClient.put(`/manager/schedules/${id}`, payload);
  return unwrap(response);
}

export async function activateSchedule(id) {
  const response = await apiClient.patch(`/manager/schedules/${id}/activate`);
  return unwrap(response);
}

export async function deactivateSchedule(id) {
  const response = await apiClient.patch(`/manager/schedules/${id}/deactivate`);
  return unwrap(response);
}
