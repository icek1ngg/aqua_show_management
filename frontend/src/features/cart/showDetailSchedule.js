import { isDateKey } from './showTicketNavigation.js';
import { isScheduleBookable } from './ticketSelectorState.js';

export function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sortedBookableSchedules(schedules, now) {
  return (Array.isArray(schedules) ? schedules : [])
    .filter((schedule) => isScheduleBookable(schedule, now))
    .sort((first, second) => (
      new Date(first.startTime).getTime() - new Date(second.startTime).getTime()
    ));
}

export function bookableDateOptions(schedules, now = Date.now()) {
  return [...new Set(sortedBookableSchedules(schedules, now).map((item) => localDateKey(item.startTime)))]
    .filter(Boolean);
}

export function chooseShowDetailSchedule(schedules, requestedDate = '', now = Date.now()) {
  const bookable = sortedBookableSchedules(schedules, now);
  const validRequestedDate = isDateKey(requestedDate) ? requestedDate : '';
  if (validRequestedDate) {
    const schedule = bookable.find((item) => localDateKey(item.startTime) === validRequestedDate) || null;
    return {
      schedule,
      effectiveDate: validRequestedDate,
      requestedDateUnavailable: !schedule,
    };
  }
  const schedule = bookable[0] || null;
  return {
    schedule,
    effectiveDate: schedule ? localDateKey(schedule.startTime) : '',
    requestedDateUnavailable: false,
  };
}
