import { useState, useRef, useEffect } from 'react';
import { format, parse, isAfter, isBefore, isEqual } from 'date-fns';
import { Calendar } from 'lucide-react';

interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const DateRangePicker = ({
  value,
  onChange,
  label,
  required = false,
  error,
  disabled = false,
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const fromDate = value.from ? parse(value.from, 'yyyy-MM-dd', new Date()) : null;
  const toDate = value.to ? parse(value.to, 'yyyy-MM-dd', new Date()) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (date: Date) => {
    if (!fromDate || (fromDate && toDate)) {
      onChange({ from: format(date, 'yyyy-MM-dd'), to: '' });
    } else if (isAfter(date, fromDate)) {
      onChange({ from: value.from, to: format(date, 'yyyy-MM-dd') });
      setIsOpen(false);
    } else {
      onChange({ from: format(date, 'yyyy-MM-dd'), to: value.from });
    }
  };

  const isInRange = (date: Date) => {
    if (!fromDate || !toDate) return false;
    return isAfter(date, fromDate) && isBefore(date, toDate);
  };

  const isRangeStart = (date: Date) => {
    if (!fromDate) return false;
    return isEqual(date, fromDate);
  };

  const isRangeEnd = (date: Date) => {
    if (!toDate) return false;
    return isEqual(date, toDate);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = (month: Date) => {
    const daysInMonth = getDaysInMonth(month);
    const firstDay = getFirstDayOfMonth(month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }

    return days;
  };

  const days = renderCalendar(displayMonth);

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
          <span className={fromDate ? 'text-gray-900' : 'text-gray-500'}>
            {fromDate && toDate
              ? `${format(fromDate, 'MMM dd')} - ${format(toDate, 'MMM dd, yyyy')}`
              : fromDate
              ? `${format(fromDate, 'MMM dd, yyyy')} - ...`
              : 'Select date range'}
          </span>
          <Calendar size={18} className="text-gray-400" />
        </button>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() =>
                  setDisplayMonth(
                    new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1)
                  )
                }
                className="p-1 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <h3 className="text-sm font-semibold text-gray-900">
                {format(displayMonth, 'MMMM yyyy')}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setDisplayMonth(
                    new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1)
                  )
                }
                className="p-1 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1 w-8">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {days.map((date, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => date && handleDateClick(date)}
                  className={`p-2 text-sm rounded transition-colors w-8 h-8 flex items-center justify-center ${
                    !date
                      ? 'text-transparent'
                      : isRangeStart(date) || isRangeEnd(date)
                      ? 'bg-blue-600 text-white font-semibold'
                      : isInRange(date)
                      ? 'bg-blue-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  onChange({
                    from: format(startOfMonth, 'yyyy-MM-dd'),
                    to: format(today, 'yyyy-MM-dd'),
                  });
                  setIsOpen(false);
                }}
                className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                  onChange({
                    from: format(lastMonth, 'yyyy-MM-dd'),
                    to: format(endOfLastMonth, 'yyyy-MM-dd'),
                  });
                  setIsOpen(false);
                }}
                className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  onChange({
                    from: format(last30Days, 'yyyy-MM-dd'),
                    to: format(today, 'yyyy-MM-dd'),
                  });
                  setIsOpen(false);
                }}
                className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Last 30 Days
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default DateRangePicker;
