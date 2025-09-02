import { useState, useRef, useCallback, useEffect } from "react";
import { DAY_TILE_HEIGHT, DAYS_PER_ROW } from "../lib/constants";
import { getISODate } from "../lib/utils";

interface CalendarDay {
  date: Date;
  dayNumber: number;
  month: number;
  year: number;
  isToday: boolean;
}

export function useInfiniteCalendar(today: Date) {
  const [daysMap, setDaysMap] = useState<Map<string, CalendarDay>>(new Map());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 21 }); // initial 3 rows

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingToDate = useRef(false);
  const lastScrollTime = useRef(0);

  const getStartOfWeek = (date: Date, weekStartsOn: number = 0) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day - weekStartsOn;
    d.setDate(d.getDate() - diff);
    return d;
  };

  const generateDays = useCallback(
    (start: Date, count: number): CalendarDay[] => {
      const days: CalendarDay[] = [];
      const todayStr = getISODate(today);
      const date = new Date(start);

      for (let i = 0; i < count; i++) {
        const key = getISODate(date);
        if (!daysMap.has(key)) {
          days.push({
            date: new Date(date),
            dayNumber: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear(),
            isToday: key === todayStr,
          });
        }
        date.setDate(date.getDate() + 1);
      }
      return days;
    },
    []
  );

  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTime.current < 64) return;
    lastScrollTime.current = now;
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const dayArray = Array.from(daysMap.values());
    const totalRows = Math.ceil(dayArray.length / DAYS_PER_ROW);

    // --- Virtualization range ---
    const buffer = 20;
    const rowsVisible = Math.ceil(containerHeight / DAY_TILE_HEIGHT);
    const startRow = Math.max(
      0,
      Math.floor(scrollTop / DAY_TILE_HEIGHT) - buffer
    );
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + containerHeight) / DAY_TILE_HEIGHT) + buffer
    );

    setVisibleRange({
      start: startRow * DAYS_PER_ROW,
      end: Math.min(dayArray.length, endRow * DAYS_PER_ROW),
    });

    // --- Update header month ---
    requestAnimationFrame(() => {
      const middleRow =
        Math.floor(scrollTop / DAY_TILE_HEIGHT) + Math.floor(rowsVisible / 2);
      const middleIndex = middleRow * DAYS_PER_ROW + 3;
      if (middleIndex >= 0 && middleIndex < dayArray.length) {
        const midDay = dayArray[middleIndex];
        if (midDay.month !== currentMonth || midDay.year !== currentYear) {
          setCurrentMonth(midDay.month);
          setCurrentYear(midDay.year);
        }
      }
    });

    if (scrollTop < 200) {
      prependDays();
    }
    if (scrollTop + containerHeight > container.scrollHeight - 200) {
      appendDays();
    }
  }, [daysMap, currentMonth, currentYear]);

  const prependDays = useCallback(() => {
    const firstDay = Array.from(daysMap.values())[0];
    if (!firstDay) return;

    const start = new Date(firstDay.date);
    start.setDate(start.getDate() - 21);
    const newDays = generateDays(start, 21);
    if (newDays.length === 0) return;

    setDaysMap((prev) => {
      const newMap = new Map();

      newDays.forEach((d) => newMap.set(getISODate(d.date), d));

      prev.forEach((d) => newMap.set(getISODate(d.date), d));
      return newMap;
    });

    // Maintain scroll position after DOM update
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop +=
          (newDays.length / DAYS_PER_ROW) * DAY_TILE_HEIGHT;
      }
    });
  }, [daysMap, generateDays]);

  const appendDays = useCallback(() => {
    const lastDay = Array.from(daysMap.values())[daysMap.size - 1];
    if (!lastDay) return;

    const start = new Date(lastDay.date);
    start.setDate(start.getDate() + 1);
    const newDays = generateDays(start, 21);
    if (newDays.length === 0) return;

    setDaysMap((prev) => {
      const newMap = new Map(prev);
      newDays.forEach((d) => newMap.set(getISODate(d.date), d));
      return newMap;
    });
  }, [daysMap, generateDays]);

  const scrollToDate = useCallback(
    (targetDate: Date) => {
      if (!scrollContainerRef.current) return;
      const dayArray = Array.from(daysMap.values());
      const dateKey = getISODate(targetDate);
      let dayIndex = dayArray.findIndex(
        (day) => getISODate(day.date) === dateKey
      );

      if (dayIndex === -1) {
        const newDays = generateDays(targetDate, 21);
        const newMap = new Map(daysMap);
        newDays.forEach((d) => newMap.set(getISODate(d.date), d));
        setDaysMap(newMap);
        dayIndex = Array.from(newMap.values()).findIndex(
          (day) => getISODate(day.date) === dateKey
        );
      }

      if (dayIndex === -1) return;

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
    [daysMap, generateDays]
  );

  useEffect(() => {
    const startOfWeek = getStartOfWeek(today);
    const todayDays = generateDays(startOfWeek, 21); // initial 3 rows

    const newMap = new Map(daysMap);

    todayDays.forEach((d) => newMap.set(getISODate(d.date), d));
    setDaysMap(newMap);
  }, []); // HERE IS PROBLEM NOT WORKING

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return {
    scrollContainerRef,
    visibleRange,
    daysArray: Array.from(daysMap.values()),
    currentMonth,
    currentYear,
    scrollToDate,
    setCurrentMonth,
    setCurrentYear,
  };
}
