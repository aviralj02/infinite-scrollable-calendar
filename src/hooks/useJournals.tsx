import { useMemo } from "react";
import mockJournals from "../lib/data/journals.json";
import { getISODate, parseDDMMYYYY } from "../lib/utils";

export function useJournals() {
  const journalsByDate = useMemo(() => {
    const map = new Map<string, Journal>();

    mockJournals.forEach((journal) => {
      map.set(getISODate(parseDDMMYYYY(journal.date)), journal);
    });
    return map;
  }, []);

  /**
   *
   * @param date typeof string (in ISO format date)
   * @returns Journal type or undefined
   */
  const getJournalForDate = (date: string): Journal | undefined => {
    return journalsByDate.get(date);
  };

  return {
    getJournalForDate,
  };
}
