const SEOUL_TIME_ZONE = 'Asia/Seoul';

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getSeoulDateParts(date: Date = new Date()): DateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return { year, month, day };
}

export function getSeoulStartOfDay(date: Date = new Date()): Date {
  const { year, month, day } = getSeoulDateParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
