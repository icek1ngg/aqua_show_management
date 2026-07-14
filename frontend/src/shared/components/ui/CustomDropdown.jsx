import { useState, useRef, useEffect } from 'react';

export default function CustomDropdown({ options, value, onChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={containerRef}>
      <button 
        type="button" 
        disabled={disabled}
        className="w-full flex items-center justify-between bg-transparent font-bold text-gray-900 focus:outline-none py-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="material-symbols-outlined text-gray-400 pointer-events-none transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full min-w-[200px] rounded-2xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto left-0">
          <ul className="py-2">
            {options.map((opt) => (
              <li 
                key={opt.value} 
                className={`cursor-pointer px-4 py-3 hover:bg-cyan-50 hover:text-cyan-700 transition ${opt.value === value ? 'bg-cyan-50 text-cyan-700 font-bold' : 'text-gray-700 font-medium'}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
