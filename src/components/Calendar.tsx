import { dayNames, monthNames } from "../lib/constants";
import { RotateCcw } from "lucide-react";
import { useInfiniteCalendar } from "../hooks/useInfiniteCalendar";
import CalendarGrid from "./CalendarGrid";
import { useState } from "react";
import { useJournals } from "../hooks/useJournals";
import JournalModal from "./JournalModal";

const Calendar: React.FC = () => {
  const today = new Date();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJournalIndex, setSelectedJournalIndex] = useState(0);

  const { getAllJournals } = useJournals();

  const {
    currentMonth,
    currentYear,
    resetToToday,
    daysArray,
    scrollContainerRef,
    visibleRange,
  } = useInfiniteCalendar(today);

  const allJournals = getAllJournals();

  return (
    <>
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

        <CalendarGrid
          currentMonth={currentMonth}
          currentYear={currentYear}
          daysArray={daysArray}
          scrollContainerRef={scrollContainerRef}
          visibleRange={visibleRange}
          openModalForSelectedJournal={(index: number) => {
            setSelectedJournalIndex(index);
            setIsModalOpen(true);
          }}
        />
      </div>

      <JournalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        journals={allJournals}
        initialIndex={selectedJournalIndex}
      />
    </>
  );
};

export default Calendar;
