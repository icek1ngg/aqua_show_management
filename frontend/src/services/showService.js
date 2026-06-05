import apiClient from '../lib/apiClient.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getShows({ keyword, page = 0, size = 10 } = {}) {
  const response = await apiClient.get('/shows', {
    params: {
      keyword: keyword || undefined,
      page,
      size,
    },
  });
  return unwrap(response);
}

export async function getShowDetail(showId) {
  const response = await apiClient.get(`/shows/${showId}`);
  return unwrap(response);
}

export async function getShowSchedules(showId) {
  const response = await apiClient.get(`/shows/${showId}/schedules`);
  return unwrap(response);
}

export async function getSchedule(scheduleId) {
  const response = await apiClient.get(`/schedules/${scheduleId}`);
  return unwrap(response);
}
