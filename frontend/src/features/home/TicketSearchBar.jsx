import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookableDateOptions } from '../cart/showDetailSchedule.js';
import { getShowSchedules, getShows } from '../../services/showService.js';
import {
  changeDrawerDate,
  changeDrawerShow,
  createDrawerSelection,
  drawerDestination,
} from '../../shared/components/navigation/ticketBookingDrawerState.js';
import CustomDropdown from '../../shared/components/ui/CustomDropdown.jsx';
import CustomDatePicker from '../../shared/components/ui/CustomDatePicker.jsx';

export default function TicketSearchBar() {
  const navigate = useNavigate();
  const [selection, setSelection] = useState(createDrawerSelection);
  const [shows, setShows] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const scheduleRequest = useRef(0);
  const dates = useMemo(() => bookableDateOptions(schedules), [schedules]);
  const destination = drawerDestination(selection);

  useEffect(() => {
    let active = true;
    getShows({ page: 0, size: 100 }).then((response) => {
      if (active) setShows(Array.isArray(response?.items) ? response.items : []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const requestId = ++scheduleRequest.current;
    setSchedules([]);
    if (!selection.showId) return undefined;
    getShowSchedules(selection.showId).then((items) => {
      if (scheduleRequest.current === requestId) setSchedules(Array.isArray(items) ? items : []);
    }).catch(() => {});
    return () => { if (scheduleRequest.current === requestId) scheduleRequest.current += 1; };
  }, [selection.showId]);

  return (
    <div className="mt-10 flex flex-col md:flex-row items-center w-full max-w-4xl bg-white rounded-3xl md:rounded-full shadow-2xl p-2 relative z-20 mx-auto">
      {/* Show Selection */}
      <div className="flex flex-1 items-center px-6 py-4 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-200">
        <span className="material-symbols-outlined text-cyan-600 mr-4 text-3xl">location_on</span>
        <div className="flex flex-col w-full relative">
          <label className="text-xs text-gray-500 font-medium mb-1 cursor-pointer">Select a destination</label>
          <CustomDropdown 
            options={shows.map(s => ({ value: s.id, label: s.title }))}
            value={selection.showId}
            onChange={(val) => setSelection((c) => changeDrawerShow(c, val))}
            placeholder="Where to?"
          />
        </div>
      </div>

      {/* Date Selection */}
      <div className="flex flex-1 items-center px-6 py-4 w-full md:w-auto">
        <span className="material-symbols-outlined text-cyan-600 mr-4 text-3xl">calendar_month</span>
        <div className="flex flex-col w-full relative">
          <label className="text-xs text-gray-500 font-medium mb-1 cursor-pointer">Select a date</label>
          <CustomDatePicker 
            availableDates={dates}
            value={selection.date}
            onChange={(val) => setSelection((c) => changeDrawerDate(c, val, dates))}
            placeholder={selection.showId ? 'When?' : 'Select destination first'}
            disabled={!selection.showId}
            showId={selection.showId}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="w-full md:w-auto p-2">
        <button 
          type="button"
          disabled={!destination}
          onClick={() => navigate(destination)}
          className="w-full md:w-auto rounded-full bg-cyan-600 px-10 py-4 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-40 shadow-lg shadow-cyan-900/20"
        >
          Book tickets
        </button>
      </div>
    </div>
  );
}
