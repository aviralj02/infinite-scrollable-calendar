import { useMemo, type RefObject } from "react";
import { DAY_TILE_HEIGHT } from "../lib/constants";
import { getISODate } from "../lib/utils";
import { useJournals } from "../hooks/useJournals";
import JournalOverlay from "./JournalOverlay";

type Props = {
  currentMonth: number;
  currentYear: number;
  daysArray: Array<CalendarDay>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  visibleRange: {
    start: number;
    end: number;
  };
};

const CalendarGrid = ({
  currentMonth,
  currentYear,
  daysArray,
  scrollContainerRef,
  visibleRange,
}: Props) => {
  const { getJournalForDate } = useJournals();

  const handleDayClick = (day: CalendarDay) => () => {
    console.log("modal open for" + day);
  };

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
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
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

                const journal = getJournalForDate(dateKey);

                return (
                  <div
                    key={dateKey}
                    className={`
                        border border-gray-200 bg-white rounded-lg p-2 relative
                        transition-all duration-200
                        ${day.isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                        ${!isCurrentMonthDay ? "opacity-40" : ""}
                        hover:shadow-sm cursor-pointer
                      `}
                    style={{
                      minHeight: `${DAY_TILE_HEIGHT}px`,
                    }}
                    onClick={handleDayClick(day)}
                  >
                    {journal && (
                      <JournalOverlay dateKey={dateKey} journal={journal} />
                    )}
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
                      <span className="z-10">{day.dayNumber}</span>
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
  );
};

export default CalendarGrid;
