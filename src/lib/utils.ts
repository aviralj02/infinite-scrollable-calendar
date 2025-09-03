export const getISODate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export const getStartOfWeek = (date: Date, weekStartsOn: number = 0): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  return d;
};
