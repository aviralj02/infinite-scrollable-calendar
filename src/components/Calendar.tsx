import { DAY_TILE_HEIGHT, dayNames, monthNames } from "../lib/constants";
import { RotateCcw } from "lucide-react";
import { getISODate } from "../lib/utils";
import { useInfiniteCalendar } from "../hooks/useInfiniteCalendar";
import { useMemo } from "react";

const Calendar: React.FC = () => {
  const today = new Date();

  const {
    currentMonth,
    currentYear,
    daysArray,
    scrollContainerRef,
    visibleRange,
    resetToToday,
  } = useInfiniteCalendar(today);

  const groupDaysIntoWeeks = (days: CalendarDay[]) => {
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const visibleDays = useMemo(() => {
    return daysArray.slice(visibleRange.start, visibleRange.end);
  }, [daysArray, visibleRange]);

  const weeks = useMemo(() => {
    return groupDaysIntoWeeks(visibleDays);
  }, [visibleDays]);

  const virtualTopHeight = useMemo(() => {
    return visibleRange.start > 0
      ? Math.floor(visibleRange.start / 7) * DAY_TILE_HEIGHT
      : 0;
  }, [visibleRange.start]);

  const virtualBottomHeight = useMemo(() => {
    return visibleRange.end < daysArray.length
      ? Math.floor((daysArray.length - visibleRange.end) / 7) * DAY_TILE_HEIGHT
      : 0;
  }, [visibleRange.end, daysArray.length]);

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
        {/* Virtual Space Top */}
        {virtualTopHeight > 0 && (
          <div style={{ height: `${virtualTopHeight}px` }} />
        )}

        <div className="px-4 sm:px-6">
          {weeks.map((week, weekIndex) => {
            const actualWeekIndex =
              Math.floor(visibleRange.start / 7) + weekIndex;

            return (
              <div
                key={`week-${actualWeekIndex}`}
                className="grid grid-cols-7 gap-1 mb-1"
              >
                {week.map((day) => {
                  const dateKey = getISODate(day.date);
                  const isCurrentMonthDay =
                    day.month === currentMonth && day.year === currentYear;

                  return (
                    <div
                      key={dateKey}
                      className={`
                        border border-gray-200 bg-white rounded-lg p-2
                        transition-all duration-200
                        ${day.isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                        ${!isCurrentMonthDay ? "opacity-40" : ""}
                        hover:shadow-sm cursor-pointer
                      `}
                      style={{
                        minHeight: `${DAY_TILE_HEIGHT}px`,
                      }}
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

        {/* Virtual Space Bottom */}
        {virtualBottomHeight > 0 && (
          <div style={{ height: `${virtualBottomHeight}px` }} />
        )}
      </div>
    </div>
  );
};

export default Calendar;
