import { format } from "date-fns";

export { cn } from "@nuts/utils";
export { debounce } from "@nuts/utils";
export { toCamelCase, getFirstSegment } from "@nuts/utils";

/**
 * Formats a date object to "dd MMMM, yyyy" format.
 * Example: 29 January, 2024
 */
export const formatDate = (date: Date): string => {
  return format(date, "d MMMM, yyyy");
};

/**
 * Returns the weekday given a date.
 * Example: "Monday"
 */
export const getWeekday = (date: Date): string => {
  return format(date, "EEEE");
};

export const formatCurrency = (amount: number, locale = "en-US", currency = "USD") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
};


