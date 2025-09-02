import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DAY_TILE_HEIGHT, dayNames, monthNames } from "../lib/constants";
import { RotateCcw } from "lucide-react";
import { getISODate } from "../lib/utils";

const Calendar: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 300 });
  const lastScrollTime = useRef<number>(0);

  const allDays = useMemo(() => {
    const days: Array<CalendarDay> = [];
    const todayStr = getISODate(today);

    const startDate = new Date(today.getFullYear() - 3, 0, 1);
    const endDate = new Date(today.getFullYear() + 2, 11, 31);

    // Start from the Sunday before the first day of the start month
    const firstDayOfStartMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1
    );
    const startDayOfWeek = firstDayOfStartMonth.getDay();
    const calendarStart = new Date(firstDayOfStartMonth);
    calendarStart.setDate(calendarStart.getDate() - startDayOfWeek);

    const current = new Date(calendarStart);
    while (current <= endDate) {
      const dateKey = getISODate(current);

      days.push({
        date: new Date(current),
        dayNumber: current.getDate(),
        month: current.getMonth(),
        year: current.getFullYear(),
        isToday: dateKey === todayStr,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [today]);

  const todayIndex = useMemo(() => {
    return allDays.findIndex(
      (day) => getISODate(day.date) === getISODate(today)
    );
  }, [allDays, today]);

  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTime.current < 64) return; // ~60fps throttle
    lastScrollTime.current = now;

    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const dayHeight = DAY_TILE_HEIGHT;
    const itemsPerRow = 7;

    // --- Virtualization range ---
    const buffer = 20; // buffer in rows
    const rowsVisible = Math.ceil(containerHeight / dayHeight);
    const startRow = Math.max(0, Math.floor(scrollTop / dayHeight) - buffer);
    const endRow = Math.min(
      Math.ceil(allDays.length / itemsPerRow),
      Math.ceil((scrollTop + containerHeight) / dayHeight) + buffer
    );

    const start = startRow * itemsPerRow;
    const end = Math.min(allDays.length, endRow * itemsPerRow);
    setVisibleRange({ start, end });

    // --- Update header month ---
    requestAnimationFrame(() => {
      const middleRow =
        Math.floor(scrollTop / dayHeight) + Math.floor(rowsVisible / 2);
      const middleIndex = middleRow * itemsPerRow + 3;
      if (middleIndex >= 0 && middleIndex < allDays.length) {
        const midDay = allDays[middleIndex];
        if (midDay.month !== currentMonth || midDay.year !== currentYear) {
          setCurrentMonth(midDay.month);
          setCurrentYear(midDay.year);
        }
      }
    });
  }, [allDays, currentMonth, currentYear]);

  const scrollToDate = useCallback(
    (targetDate: Date) => {
      if (!scrollContainerRef.current) return;

      const dateKey = getISODate(targetDate);
      const dayIndex = allDays.findIndex(
        (day) => getISODate(day.date) === dateKey
      );

      if (dayIndex === -1) return;

      const container = scrollContainerRef.current;
      const containerHeight = container.clientHeight;

      const rowIndex = Math.floor(dayIndex / 7);
      const scrollPosition = rowIndex * DAY_TILE_HEIGHT - containerHeight / 3;

      container.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: "smooth",
      });
    },
    [allDays]
  );

  const resetToToday = useCallback(() => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    scrollToDate(today);
  }, [scrollToDate, today]);

  const groupDaysIntoWeeks = (days: Array<CalendarDay>) => {
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const visibleDays = allDays.slice(visibleRange.start, visibleRange.end);
  const weeks = groupDaysIntoWeeks(visibleDays);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayIndex !== -1) {
        scrollToDate(today);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 transition-all duration-300">
            {monthNames[currentMonth]} {currentYear}
          </h1>
          <button
            onClick={resetToToday}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Go to today"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Today</span>
          </button>
        </div>
      </div>

      {/* Fixed Day Headers */}
      <div className="sticky top-[73px] z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 py-3"
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ height: "calc(100vh - 146px)" }}
      >
        {/* VIRTUAL SPACE */}
        {visibleRange.start > 0 && (
          <div
            style={{
              height: `${
                Math.floor(visibleRange.start / 7) * DAY_TILE_HEIGHT
              }px`,
            }}
          />
        )}

        <div className="px-4 sm:px-6">
          {weeks.map((week, weekIndex) => {
            const actualWeekIndex =
              Math.floor(visibleRange.start / 7) + weekIndex;

            return (
              <div
                key={actualWeekIndex}
                className="grid grid-cols-7 gap-1 mb-1"
              >
                {week.map((day) => {
                  const dateKey = getISODate(day.date);
                  const isCurrentMonthDay =
                    day.month === currentMonth && day.year === currentYear;

                  return (
                    <div
                      key={dateKey}
                      ref={(el) => {
                        if (el) {
                          dayRefs.current.set(dateKey, el);
                        } else {
                          dayRefs.current.delete(dateKey);
                        }
                      }}
                      className={`
                        min-h-[${DAY_TILE_HEIGHT}px] border border-gray-200 bg-white rounded-lg p-2
                        transition-all duration-200
                        ${day.isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                        ${!isCurrentMonthDay ? "opacity-40" : ""}
                        hover:shadow-sm cursor-pointer
                      `}
                    >
                      <div
                        className={`
                          text-sm font-semibold mb-2 flex items-center justify-between
                          ${
                            day.isToday
                              ? "text-blue-600"
                              : isCurrentMonthDay
                              ? "text-gray-700"
                              : "text-gray-400"
                          }
                        `}
                      >
                        <span>{day.dayNumber}</span>
                        {day.dayNumber === 1 && (
                          <span className="text-xs font-medium text-gray-500">
                            {new Date(day.year, day.month).toLocaleDateString(
                              "en-US",
                              { month: "short" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* VIRTUAL SPACE */}
        {visibleRange.end < allDays.length && (
          <div
            style={{
              height: `${
                Math.floor((allDays.length - visibleRange.end) / 7) *
                DAY_TILE_HEIGHT
              }px`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Calendar;
