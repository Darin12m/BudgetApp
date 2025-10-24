import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfWeek, endOfWeek, subWeeks, format, isSameWeek, isSameMonth, parseISO } from 'date-fns'; // Added date-fns imports

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The formatCurrency function is now provided by the CurrencyContext
// export const formatCurrency = (value: number): string => {
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD',
//     minimumFractionDigits: 2,
//   }).format(value);
// };

// Re-exporting Investment interface from use-investment-data for type consistency
import { Investment } from '@/hooks/use-investment-data'; // Updated import path

export const calculateGainLoss = (investment: Investment) => {
  const invested = investment.quantity * investment.buyPrice;
  const currentValue = investment.quantity * investment.currentPrice;
  const gainLoss = currentValue - invested;
  const gainLossPercentage = invested === 0 ? 0 : (gainLoss / invested) * 100;
  return { gainLoss, gainLossPercentage };
};

// --- New Date Utility Functions ---

/**
 * Gets the start of the current week.
 * @param date The reference date (defaults to now).
 * @returns A Date object representing the start of the week.
 */
export const getStartOfCurrentWeek = (date: Date = new Date()): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday as start of week
};

/**
 * Gets the end of the current week.
 * @param date The reference date (defaults to now).
 * @returns A Date object representing the end of the week.
 */
export const getEndOfCurrentWeek = (date: Date = new Date()): Date => {
  return endOfWeek(date, { weekStartsOn: 1 }); // Monday as start of week
};

/**
 * Gets the start of the previous week.
 * @param date The reference date (defaults to now).
 * @returns A Date object representing the start of the previous week.
 */
export const getStartOfPreviousWeek = (date: Date = new Date()): Date => {
  return startOfWeek(subWeeks(date, 1), { weekStartsOn: 1 });
};

/**
 * Gets the end of the previous week.
 * @param date The reference date (defaults to now).
 * @returns A Date object representing the end of the previous week.
 */
export const getEndOfPreviousWeek = (date: Date = new Date()): Date => {
  return endOfWeek(subWeeks(date, 1), { weekStartsOn: 1 });
};

/**
 * Checks if a transaction date falls within the current week.
 * @param transactionDateString The transaction date string (YYYY-MM-DD).
 * @param referenceDate The reference date (defaults to now).
 * @returns True if the transaction is in the current week, false otherwise.
 */
export const isTransactionInCurrentWeek = (transactionDateString: string, referenceDate: Date = new Date()): boolean => {
  const transactionDate = parseISO(transactionDateString);
  return isSameWeek(transactionDate, referenceDate, { weekStartsOn: 1 });
};

/**
 * Checks if a transaction date falls within the previous week.
 * @param transactionDateString The transaction date string (YYYY-MM-DD).
 * @param referenceDate The reference date (defaults to now).
 * @returns True if the transaction is in the previous week, false otherwise.
 */
export const isTransactionInPreviousWeek = (transactionDateString: string, referenceDate: Date = new Date()): boolean => {
  const transactionDate = parseISO(transactionDateString);
  const previousWeekDate = subWeeks(referenceDate, 1);
  return isSameWeek(transactionDate, previousWeekDate, { weekStartsOn: 1 });
};

/**
 * Checks if a transaction date falls within the current month.
 * @param transactionDateString The transaction date string (YYYY-MM-DD).
 * @param referenceDate The reference date (defaults to now).
 * @returns True if the transaction is in the current month, false otherwise.
 */
export const isTransactionInCurrentMonth = (transactionDateString: string, referenceDate: Date = new Date()): boolean => {
  const transactionDate = parseISO(transactionDateString);
  return isSameMonth(transactionDate, referenceDate);
};

/**
 * Formats a date string or Date object into a readable string.
 * @param dateInput The date string (YYYY-MM-DD) or Date object.
 * @param formatString The format string (e.g., 'MMM dd, yyyy'). Defaults to 'MMM dd, yyyy'.
 * @returns Formatted date string.
 */
export const formatDate = (dateInput: string | Date, formatString: string = 'MMM dd, yyyy'): string => {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return format(date, formatString);
};