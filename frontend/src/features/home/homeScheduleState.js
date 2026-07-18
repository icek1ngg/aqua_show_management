function scheduleTime(schedule) {
  const value = new Date(schedule?.startTime).getTime();
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

export function sortUpcomingSchedules(schedules) {
  return (Array.isArray(schedules) ? schedules : [])
    .filter((schedule) => schedule?.scheduleId && schedule?.showId && Number.isFinite(scheduleTime(schedule)))
    .sort((first, second) => {
      const timeDifference = scheduleTime(first) - scheduleTime(second);
      if (timeDifference !== 0) return timeDifference;
      return String(first.scheduleId).localeCompare(String(second.scheduleId));
    });
}

export function featuredShowsFromSchedules(schedules, keyword = '') {
  const normalizedKeyword = String(keyword || '').trim().toLocaleLowerCase();
  const uniqueShows = new Map();

  sortUpcomingSchedules(schedules).forEach((schedule) => {
    const showId = String(schedule.showId);
    if (uniqueShows.has(showId)) return;

    uniqueShows.set(showId, {
      id: showId,
      title: schedule.showTitle,
      imageUrl: schedule.showImageUrl || null,
      shortDescription: schedule.showShortDescription || '',
      durationMinutes: schedule.durationMinutes,
      nextScheduleId: schedule.scheduleId,
      nextStartTime: schedule.startTime,
      venueName: schedule.venueName,
    });
  });

  const shows = [...uniqueShows.values()];
  if (!normalizedKeyword) return shows;

  return shows.filter((show) => `${show.title || ''} ${show.shortDescription || ''}`
    .toLocaleLowerCase()
    .includes(normalizedKeyword));
}
