import { useState, useRef, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  required = false,
  error,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const parsed = parse(value, 'yyyy-MM-dd', new Date());
      if (isValid(parsed)) {
        setDisplayDate(parsed);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setDisplayDate(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setDisplayDate(null);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const currentMonth = displayDate || new Date();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!displayDate) return false;
    return (
      date.getDate() === displayDate.getDate() &&
      date.getMonth() === displayDate.getMonth() &&
      date.getFullYear() === displayDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-2.5 border rounded-lg text-sm text-left flex items-center justify-between transition-all ${
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-blue-600'
          } ${
            disabled
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent'
          }`}
        >
          <span className={displayDate ? 'text-gray-900' : 'text-gray-500'}>
            {displayDate ? format(displayDate, 'MMM dd, yyyy') : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {displayDate && (
              <X
                size={16}
                className="text-gray-400 hover:text-gray-600"
                onClick={handleClear}
              />
            )}
            <Calendar size={18} className="text-gray-400" />
          </div>
        </button>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() =>
                  setDisplayDate(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                  )
                }
                className="p-1 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <h3 className="text-sm font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setDisplayDate(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                  )
                }
                className="p-1 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => date && !isDateDisabled(date) && handleDateSelect(date)}
                  disabled={!date || isDateDisabled(date)}
                  className={`p-2 text-sm rounded transition-colors ${
                    !date
                      ? 'text-transparent'
                      : isDateSelected(date)
                      ? 'bg-blue-600 text-white font-semibold'
                      : isToday(date)
                      ? 'bg-blue-100 text-blue-600 font-semibold'
                      : isDateDisabled(date)
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleDateSelect(tomorrow);
                }}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Tomorrow
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default DatePicker;
