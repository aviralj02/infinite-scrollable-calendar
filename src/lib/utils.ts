/**
 * We are using a single date format in whole application which is the ISO Date format like: "YYYY-MM-DD"
 */
export const getISODate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

export const getStartOfWeek = (date: Date, weekStartsOn: number = 0): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  return d;
};
