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

  const getAllJournals = (): Array<Journal> => {
    return mockJournals.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const getJournalIndex = (date: string): number => {
    const allJournals = getAllJournals();
    return allJournals.findIndex(
      (journal) => getISODate(parseDDMMYYYY(journal.date)) === date
    );
  };

  return {
    getJournalForDate,
    getAllJournals,
    getJournalIndex,
  };
}
