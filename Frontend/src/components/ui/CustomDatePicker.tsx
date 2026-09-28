import React, { useState, useRef, useEffect } from "react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD or formatted
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Seleccione fecha…",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default initial date view
  const parseVal = (v: string) => {
    const d = new Date(v.includes("-") ? v + "T00:00:00" : v);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = parseVal(value);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${m}-${d}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Format label for display
  const displayLabel = value
    ? value.includes("-")
      ? new Date(value + "T00:00:00").toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : value
    : placeholder;

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`input flex items-center justify-between gap-2 w-full text-left font-medium select-none cursor-pointer ${
          !value ? "text-slate-400" : "text-slate-900"
        } ${isOpen ? "border-navy-900 ring-4 ring-navy-900/10" : ""}`}
      >
        <span className="truncate">{displayLabel}</span>
        <svg className="w-4 h-4 text-navy-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeup p-4">
          {/* Month / Year header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-navy-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const m = String(viewMonth + 1).padStart(2, "0");
              const d = String(dayNum).padStart(2, "0");
              const dateIso = `${viewYear}-${m}-${d}`;
              const isSelected = value === dateIso || value.includes(String(dayNum));

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-8 text-xs font-semibold rounded-lg transition-all flex items-center justify-center mx-auto ${
                    isSelected
                      ? "bg-navy-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-navy-50 hover:text-navy-900"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
