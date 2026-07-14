import { useState, useRef, useEffect } from 'react';

export default function CustomDatePicker({ availableDates, value, onChange, placeholder, disabled, showId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setErrorMsg('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (availableDates && availableDates.length > 0) {
      const firstAvailable = new Date(availableDates[0]);
      if (!isNaN(firstAvailable.getTime())) {
        setCurrentMonth(firstAvailable);
      }
    } else {
      setCurrentMonth(new Date());
    }
  }, [availableDates]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day, e) => {
    e.stopPropagation();
    if (!showId) return;
    
    const yyyy = currentMonth.getFullYear();
    const mm = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (availableDates.includes(dateStr)) {
      onChange(dateStr);
      setIsOpen(false);
      setErrorMsg('');
    } else {
      setErrorMsg('No shows available on this date.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const getDaysArray = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className={`relative w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={containerRef}>
      <button 
        type="button" 
        disabled={disabled}
        className="w-full flex items-center justify-between bg-transparent font-bold text-gray-900 focus:outline-none py-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{value || placeholder}</span>
        <span className="material-symbols-outlined text-gray-400 pointer-events-none transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-[320px] rounded-3xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 p-4 left-0 md:left-auto md:right-0">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full transition">
              <span className="material-symbols-outlined text-gray-600">chevron_left</span>
            </button>
            <span className="font-bold text-gray-800">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full transition">
              <span className="material-symbols-outlined text-gray-600">chevron_right</span>
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <span key={day} className="text-xs font-bold text-gray-400 uppercase">{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysArray().map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="h-10 w-10"></div>;
              
              const yyyy = currentMonth.getFullYear();
              const mm = String(currentMonth.getMonth() + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dateStr = `${yyyy}-${mm}-${dd}`;
              
              const isAvailable = availableDates.includes(dateStr);
              const isSelected = value === dateStr;

              let btnClass = "h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all font-medium ";
              if (isSelected) {
                btnClass += "bg-cyan-600 text-white shadow-md font-bold";
              } else if (isAvailable) {
                btnClass += "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 font-bold border border-cyan-200";
              } else {
                btnClass += "text-gray-400 hover:bg-gray-50";
              }

              return (
                <button 
                  key={day} 
                  type="button" 
                  onClick={(e) => handleDateClick(day, e)}
                  className={btnClass}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-600 font-medium text-center flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errorMsg}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
