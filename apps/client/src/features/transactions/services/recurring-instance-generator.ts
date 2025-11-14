import { RecurringTransaction, RecurringInstance, FrequencyData } from "./recurring-transaction.types";
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay, endOfDay } from "date-fns";

interface GeneratorOptions {
  startDate: Date;
  endDate: Date;
  maxInstances?: number;
}

export class RecurringInstanceGenerator {
  generateInstances(recurring: RecurringTransaction, options: GeneratorOptions): RecurringInstance[] {
    const instances: RecurringInstance[] = [];
    const { startDate, endDate, maxInstances = 100 } = options;

    if (recurring.is_paused) {
      return instances;
    }

    let currentDate = new Date(recurring.next_due_date);
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(endDate);
    const seriesEnd = recurring.end_date ? new Date(recurring.end_date) : null;

    let instanceCount = 0;
    const maxOccurrences = recurring.max_occurrences;
    const currentOccurrences = recurring.occurrences_count;

    while (
      isBefore(currentDate, rangeEnd) &&
      instanceCount < maxInstances &&
      (!maxOccurrences || currentOccurrences + instanceCount < maxOccurrences) &&
      (!seriesEnd || isBefore(currentDate, seriesEnd))
    ) {
      if (!isBefore(currentDate, rangeStart)) {
        instances.push({
          due_date: new Date(currentDate),
          amount: recurring.amount,
          description: recurring.description,
          transaction_id: undefined,
          status: "pending",
          is_projected: true,
          can_modify: true,
        });
        instanceCount++;
      }

      currentDate = this.getNextOccurrence(currentDate, recurring);
    }

    return instances;
  }

  getNextOccurrence(currentDate: Date, recurring: RecurringTransaction): Date {
    const { frequency, frequency_interval, frequency_data } = recurring;

    switch (frequency) {
      case "daily":
        return addDays(currentDate, frequency_interval);

      case "weekly":
        return addWeeks(currentDate, frequency_interval);

      case "biweekly":
        return addWeeks(currentDate, 2);

      case "monthly":
        return this.getNextMonthlyOccurrence(currentDate, frequency_interval, frequency_data);

      case "yearly":
        return addYears(currentDate, frequency_interval);

      case "custom":
        return this.getNextCustomOccurrence(currentDate, frequency_data);

      default:
        return addDays(currentDate, 1);
    }
  }

  private getNextMonthlyOccurrence(currentDate: Date, interval: number, frequencyData?: FrequencyData): Date {
    if (!frequencyData) {
      return addMonths(currentDate, interval);
    }

    if (frequencyData.day_of_month) {
      const nextMonth = addMonths(currentDate, interval);
      const targetDay = Math.min(frequencyData.day_of_month, this.getDaysInMonth(nextMonth));
      nextMonth.setDate(targetDay);
      return nextMonth;
    }

    if (frequencyData.week_of_month !== undefined && frequencyData.day_of_week !== undefined) {
      return this.getNextWeekdayOfMonth(currentDate, interval, frequencyData.week_of_month, frequencyData.day_of_week);
    }

    if (frequencyData.specific_dates && frequencyData.specific_dates.length > 0) {
      return this.getNextSpecificDateOccurrence(currentDate, interval, frequencyData.specific_dates);
    }

    return addMonths(currentDate, interval);
  }

  private getNextCustomOccurrence(currentDate: Date, frequencyData?: FrequencyData): Date {
    if (!frequencyData) {
      return addDays(currentDate, 1);
    }

    if (frequencyData.week_days && frequencyData.week_days.length > 0) {
      return this.getNextWeekdayOccurrence(currentDate, frequencyData.week_days);
    }

    if (frequencyData.pattern) {
      return this.getNextPatternOccurrence(currentDate, frequencyData.pattern);
    }

    return addDays(currentDate, 1);
  }

  private getNextWeekdayOfMonth(currentDate: Date, monthInterval: number, weekOfMonth: number, dayOfWeek: number): Date {
    const nextMonth = addMonths(currentDate, monthInterval);
    nextMonth.setDate(1);

    if (weekOfMonth === -1) {
      const lastDay = this.getDaysInMonth(nextMonth);
      nextMonth.setDate(lastDay);

      while (nextMonth.getDay() !== dayOfWeek) {
        nextMonth.setDate(nextMonth.getDate() - 1);
      }

      return nextMonth;
    }

    while (nextMonth.getDay() !== dayOfWeek) {
      nextMonth.setDate(nextMonth.getDate() + 1);
    }

    nextMonth.setDate(nextMonth.getDate() + (weekOfMonth - 1) * 7);

    return nextMonth;
  }

  private getNextSpecificDateOccurrence(currentDate: Date, monthInterval: number, specificDates: number[]): Date {
    const sortedDates = [...specificDates].sort((a, b) => a - b);
    const currentDay = currentDate.getDate();

    for (const targetDay of sortedDates) {
      if (targetDay > currentDay) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(Math.min(targetDay, this.getDaysInMonth(nextDate)));
        return nextDate;
      }
    }

    const nextMonth = addMonths(currentDate, monthInterval);
    const firstTargetDay = Math.min(sortedDates[0], this.getDaysInMonth(nextMonth));
    nextMonth.setDate(firstTargetDay);
    return nextMonth;
  }

  private getNextWeekdayOccurrence(currentDate: Date, weekDays: number[]): Date {
    const sortedWeekDays = [...weekDays].sort((a, b) => a - b);
    let nextDate = addDays(currentDate, 1);
    const maxAttempts = 7;
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (sortedWeekDays.includes(nextDate.getDay())) {
        return nextDate;
      }
      nextDate = addDays(nextDate, 1);
      attempts++;
    }

    return addDays(currentDate, 1);
  }

  private getNextPatternOccurrence(currentDate: Date, pattern: string): Date {
    switch (pattern.toLowerCase()) {
      case "first_monday":
        return this.getNextWeekdayOfMonth(currentDate, 1, 1, 1);

      case "last_weekday": {
        const nextMonth = addMonths(currentDate, 1);
        nextMonth.setDate(1);
        const lastDay = this.getDaysInMonth(nextMonth);
        nextMonth.setDate(lastDay);

        while (nextMonth.getDay() === 0 || nextMonth.getDay() === 6) {
          nextMonth.setDate(nextMonth.getDate() - 1);
        }

        return nextMonth;
      }

      case "first_and_fifteenth":
        return this.getNextSpecificDateOccurrence(currentDate, 1, [1, 15]);

      case "last_day": {
        const nextMonth = addMonths(currentDate, 1);
        const lastDay = this.getDaysInMonth(nextMonth);
        nextMonth.setDate(lastDay);
        return nextMonth;
      }

      case "weekdays_only":
        return this.getNextWeekdayOccurrence(currentDate, [1, 2, 3, 4, 5]);

      default:
        return addDays(currentDate, 1);
    }
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
}

export const recurringInstanceGenerator = new RecurringInstanceGenerator();

export function generateRecurringInstances(
  recurring: RecurringTransaction,
  startDate: Date,
  endDate: Date,
  maxInstances?: number
): RecurringInstance[] {
  return recurringInstanceGenerator.generateInstances(recurring, {
    startDate,
    endDate,
    maxInstances,
  });
}
