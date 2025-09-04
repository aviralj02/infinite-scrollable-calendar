import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { DAY_TILE_HEIGHT, DAYS_PER_ROW } from "../lib/constants";
import { getISODate, getStartOfWeek } from "../lib/utils";

const INITIAL_DAYS = 70;
const BUFFER_DAYS = 35;
const SCROLL_THRESHOLD = 200;

export function useInfiniteCalendar(today: Date) {
  const [daysMap, setDaysMap] = useState<Map<string, CalendarDay>>(new Map());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: INITIAL_DAYS,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingToDate = useRef(false);
  const lastScrollTime = useRef(0);
  const didInit = useRef(false);
  const isUpdating = useRef(false);

  const todayStr = useMemo(() => getISODate(today), [today]);

  const generateDays = useCallback(
    (start: Date, count: number): Array<CalendarDay> => {
      const days: Array<CalendarDay> = [];
      const date = new Date(start);

      for (let i = 0; i < count; i++) {
        const key = getISODate(date);
        days.push({
          date: new Date(date),
          dayNumber: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          isToday: key === todayStr,
        });
        date.setDate(date.getDate() + 1);
      }
      return days;
    },
    [todayStr]
  );

  const daysArray = useMemo(() => {
    return Array.from(daysMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [daysMap]);

  const prependDays = useCallback(() => {
    if (isUpdating.current || daysArray.length === 0) return;

    isUpdating.current = true;
    const firstDay = daysArray[0];
    const start = new Date(firstDay.date);
    start.setDate(start.getDate() - BUFFER_DAYS);
    const newDays = generateDays(start, BUFFER_DAYS);

    setDaysMap((prev) => {
      const newMap = new Map();
      newDays.forEach((d) => newMap.set(getISODate(d.date), d));
      prev.forEach((d, key) => newMap.set(key, d));
      return newMap;
    });

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        const rowsAdded = Math.ceil(newDays.length / DAYS_PER_ROW);
        scrollContainerRef.current.scrollTop += rowsAdded * DAY_TILE_HEIGHT;
      }
      isUpdating.current = false;
    });
  }, [daysArray, generateDays]);

  const appendDays = useCallback(() => {
    if (isUpdating.current || daysArray.length === 0) return;

    isUpdating.current = true;
    const lastDay = daysArray[daysArray.length - 1];
    const start = new Date(lastDay.date);
    start.setDate(start.getDate() + 1);
    const newDays = generateDays(start, BUFFER_DAYS);

    setDaysMap((prev) => {
      const newMap = new Map(prev);
      newDays.forEach((d) => newMap.set(getISODate(d.date), d));
      return newMap;
    });

    requestAnimationFrame(() => {
      isUpdating.current = false;
    });
  }, [daysArray, generateDays]);

  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTime.current < 16 || isUpdating.current) return;
    lastScrollTime.current = now;
    const container = scrollContainerRef.current;
    if (!container || isScrollingToDate.current) return;

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const totalRows = Math.ceil(daysArray.length / DAYS_PER_ROW);

    // --- Virtualization range ---
    const rowsVisible = Math.ceil(containerHeight / DAY_TILE_HEIGHT);
    const startRow = Math.max(
      0,
      Math.floor(scrollTop / DAY_TILE_HEIGHT) - BUFFER_DAYS
    );
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + containerHeight) / DAY_TILE_HEIGHT) + BUFFER_DAYS
    );

    setVisibleRange({
      start: startRow * DAYS_PER_ROW,
      end: Math.min(daysArray.length, endRow * DAYS_PER_ROW),
    });

    // --- Update header month ---
    const middleRow =
      Math.floor(scrollTop / DAY_TILE_HEIGHT) + Math.floor(rowsVisible / 2);
    const middleIndex = middleRow * DAYS_PER_ROW + 3; // Use middle of week

    if (middleIndex >= 0 && middleIndex < daysArray.length) {
      const midDay = daysArray[middleIndex];
      if (
        midDay &&
        (midDay.month !== currentMonth || midDay.year !== currentYear)
      ) {
        setCurrentMonth(midDay.month);
        setCurrentYear(midDay.year);
      }
    }

    // Infinite scroll triggers
    if (scrollTop < SCROLL_THRESHOLD && daysArray.length > 0) {
      prependDays();
    }

    if (
      scrollTop + containerHeight > container.scrollHeight - SCROLL_THRESHOLD &&
      daysArray.length > 0
    ) {
      appendDays();
    }
  }, [daysArray, currentMonth, currentYear, prependDays, appendDays]);

  const scrollToDate = useCallback(
    (targetDate: Date) => {
      if (!scrollContainerRef.current) return;

      const dateKey = getISODate(targetDate);
      let dayIndex = daysArray.findIndex(
        (day) => getISODate(day.date) === dateKey
      );

      if (dayIndex === -1) {
        // Generate days around the target date
        const startOfWeek = getStartOfWeek(targetDate);
        const start = new Date(startOfWeek);
        start.setDate(start.getDate() - BUFFER_DAYS);
        const newDays = generateDays(start, BUFFER_DAYS * 2);

        setDaysMap((prev) => {
          const newMap = new Map(prev);
          newDays.forEach((d) => newMap.set(getISODate(d.date), d));
          return newMap;
        });

        // Wait for state update and try again
        setTimeout(() => scrollToDate(targetDate), 100);
        return;
      }

      isScrollingToDate.current = true;
      const container = scrollContainerRef.current;
      const containerHeight = container.clientHeight;
      const rowIndex = Math.floor(dayIndex / DAYS_PER_ROW);
      const scrollPosition = rowIndex * DAY_TILE_HEIGHT - containerHeight / 3;

      container.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: "smooth",
      });

      setTimeout(() => {
        isScrollingToDate.current = false;
      }, 1000);
    },
    [daysArray, generateDays]
  );

  const resetToToday = useCallback(() => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    scrollToDate(today);
  }, [scrollToDate, today]);

  useEffect(() => {
    if (daysMap.size > 0) return;

    const startOfWeek = getStartOfWeek(today);
    const start = new Date(startOfWeek);
    start.setDate(start.getDate() - BUFFER_DAYS);
    const initialDays = generateDays(start, INITIAL_DAYS + BUFFER_DAYS * 2);

    const newMap = new Map();
    initialDays.forEach((d) => newMap.set(getISODate(d.date), d));
    setDaysMap(newMap);
  }, [generateDays, today, daysMap.size]);

  useEffect(() => {
    if (didInit.current || daysArray.length === 0) return;
    didInit.current = true;

    const timer = setTimeout(() => {
      scrollToDate(today);
    }, 100);

    return () => clearTimeout(timer);
  }, [daysArray.length, scrollToDate, today]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const throttledHandleScroll = () => {
      if (!isUpdating.current) {
        handleScroll();
      }
    };

    container.addEventListener("scroll", throttledHandleScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", throttledHandleScroll);
    };
  }, [handleScroll]);

  return {
    scrollContainerRef,
    visibleRange,
    daysArray,
    currentMonth,
    currentYear,
    resetToToday,
  };
}
