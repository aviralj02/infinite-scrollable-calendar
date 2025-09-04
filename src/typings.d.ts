interface CalendarDay {
  date: Date;
  dayNumber: number;
  month: number;
  year: number;
  isToday: boolean;
}

interface Journal {
  imgUrl: string;
  rating: number;
  categories: Array<string>;
  date: string;
  description: string;
}
