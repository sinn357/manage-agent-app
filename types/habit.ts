export interface Habit {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string;
  recurrenceType: string;
  recurrenceDays: string | null;
  timeOfDay: string | null;
  defaultDuration: number | null;
  active: boolean;
  isCheckedToday?: boolean;
}
