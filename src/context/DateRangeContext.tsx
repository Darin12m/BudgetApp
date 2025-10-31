"use client";

import React, { createContext, useContext, useState, useLayoutEffect, useCallback, ReactNode } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  subMonths, addMonths, subWeeks, addWeeks,
  isSameDay, format, isWithinInterval, startOfDay, endOfDay,
  isSameMonth, isSameWeek, subDays, addDays
} from 'date-fns';

// Define the shape of a date range for the context
interface ContextDateRange {
  from: Date | undefined;
  to: Date | undefined;
  label: string; // A human-readable label for the selected range
}

// Define the shape of the context value
interface DateRangeContextType {
  selectedRange: ContextDateRange;
  setRange: (range: ContextDateRange | undefined) => void; // Updated to accept undefined for "All Time"
  goToPreviousPeriod: () => void;
  goToNextPeriod: () => void;
  setQuickPeriod: (period: 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth') => void;
}

// Create the context
const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

// Helper to get default "This Month" range
const getThisMonthRange = (): ContextDateRange => {
  const now = new Date();
  return {
    from: startOfMonth(now),
    to: endOfMonth(now),
    label: format(now, 'MMMM yyyy'),
  };
};

// Helper to get default "Today" range
const getTodayRange = (): ContextDateRange => {
  const now = new Date();
  return {
    from: startOfDay(now),
    to: endOfDay(now),
    label: format(now, 'MMM dd, yyyy'),
  };
};

// Helper to get default "This Week" range
const getThisWeekRange = (): ContextDateRange => {
  const now = new Date();
  return {
    from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    to: endOfWeek(now, { weekStartsOn: 1 }),     // Sunday
    label: `${format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM dd')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`,
  };
};

// Helper to get default "Last Month" range
const getLastMonthRange = (): ContextDateRange => {
  const now = new Date();
  const lastMonth = subMonths(now, 1);
  return {
    from: startOfMonth(lastMonth),
    to: endOfMonth(lastMonth),
    label: format(lastMonth, 'MMMM yyyy'),
  };
};

// Helper to generate a label for a given range
const generateLabel = (from: Date | undefined, to: Date | undefined): string => {
  if (!from && !to) return 'Select Date Range';
  if (from && !to) return format(from, 'MMM dd, yyyy');
  if (!from && to) return format(to, 'MMM dd, yyyy');

  // If both are defined
  if (from && to && isSameDay(from, to)) {
    return format(from, 'MMM dd, yyyy');
  }
  if (from && to && isSameMonth(from, to)) {
    return `${format(from, 'MMM dd')} - ${format(to, 'MMM dd, yyyy')}`;
  }
  if (from && to) {
    return `${format(from, 'MMM dd, yyyy')} - ${format(to, 'MMM dd, yyyy')}`;
  }
  return 'Select Date Range'; // Fallback
};


export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedRange, setSelectedRange] = useState<ContextDateRange>(getThisMonthRange());

  // Use useLayoutEffect to read from localStorage before the first render
  useLayoutEffect(() => {
    const savedRange = localStorage.getItem('selectedDateRange');
    if (savedRange) {
      const parsedRange = JSON.parse(savedRange);
      setSelectedRange({
        from: parsedRange.from ? new Date(parsedRange.from) : undefined,
        to: parsedRange.to ? new Date(parsedRange.to) : undefined,
        label: parsedRange.label,
      });
    } else {
      // Default to "This Month" if nothing is saved
      setSelectedRange(getThisMonthRange());
      localStorage.setItem('selectedDateRange', JSON.stringify({
        from: getThisMonthRange().from?.toISOString(),
        to: getThisMonthRange().to?.toISOString(),
        label: getThisMonthRange().label,
      }));
    }
  }, []);

  // Function to set a new date range and save to localStorage
  const setRange = useCallback((range: ContextDateRange | undefined) => {
    if (range === undefined) { // Handle "All Time"
      setSelectedRange({ from: undefined, to: undefined, label: 'All Time' });
      localStorage.removeItem('selectedDateRange');
    } else {
      setSelectedRange(range);
      localStorage.setItem('selectedDateRange', JSON.stringify({
        from: range.from?.toISOString(),
        to: range.to?.toISOString(),
        label: range.label,
      }));
    }
  }, []);

  const goToPreviousPeriod = useCallback(() => {
    const { from, to } = selectedRange;
    if (!from || !to) {
      setRange(getThisMonthRange()); // Default to this month if no range is set
      return;
    }

    // Determine the current period type (day, week, month)
    if (isSameDay(from, to)) { // Single day
      const newFrom = subDays(from, 1);
      const newTo = subDays(to, 1);
      setRange({ from: newFrom, to: newTo, label: generateLabel(newFrom, newTo) });
    } else if (isSameWeek(from, to, { weekStartsOn: 1 })) { // Week
      const newFrom = subWeeks(from, 1);
      const newTo = endOfWeek(newFrom, { weekStartsOn: 1 });
      setRange({ from: newFrom, to: newTo, label: generateLabel(newFrom, newTo) });
    } else if (isSameMonth(from, to)) { // Month
      const newFrom = startOfMonth(subMonths(from, 1));
      const newTo = endOfMonth(newFrom);
      setRange({ from: newFrom, to: newTo, label: generateLabel(newFrom, newTo) });
    } else { // Custom range, move back by the duration of the current range
      const duration = to.getTime() - from.getTime();
      const newFrom = new Date(from.getTime() - (duration + 24 * 60 * 60 * 1000)); // Move back by duration + 1 day
      const newTo = new Date(to.getTime() - (duration + 24 * 60 * 60 * 1000));
      setRange({ from: newFrom, to: newTo, label: generateLabel(newFrom, newTo) });
    }
  }, [selectedRange, setRange]);

  const goToNextPeriod = useCallback(() => {
    const { from, to } = selectedRange;
    if (!from || !to) {
      setRange(getThisMonthRange()); // Default to this month if no range is set
      return;
    }

    // Determine the current period type (day, week, month)
    if (isSameDay(from, to)) { // Single day
      const newFrom = addDays(from, 1);
      const newTo = addDays(to, 1);
      setRange({ from: newFrom, to: newTo, label: generateLabel(newFrom, newTo) });
    } else if (isSameWeek(from, to, { weekStartsOn: 1 })) { // Week
      const newFrom = addWeeks(from, 1);
      const newTo = endOfWeek(newFrom, { weekStartsOn: 1 });
      setRange({ from: newFrom, to: newTo, label: generateLabel(newFrom, newTo) });
    } else if (isSameMonth(from, to)) { // Month
      const newFrom = startOfMonth(addMonths(from, 1));
      const newTo = endOfMonth(newFrom);
      setRange({ from: newFrom, to: newTo, label: generateLabel(newFrom, newTo) });
    } else { // Custom range, move forward by the duration of the current range
      const duration = to.getTime() - from.getTime();
      const newFrom = new Date(from.getTime() + (duration + 24 * 60 * 60 * 1000)); // Move forward by duration + 1 day
      const newTo = new Date(to.getTime() + (duration + 24 * 60 * 60 * 1000));
      setRange({ from: newFrom, to: newTo, label: generateLabel(newFrom, newTo) });
    }
  }, [selectedRange, setRange]);

  const setQuickPeriod = useCallback((period: 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth') => {
    let newRange: ContextDateRange;

    switch (period) {
      case 'today':
        newRange = getTodayRange();
        break;
      case 'thisWeek':
        newRange = getThisWeekRange();
        break;
      case 'thisMonth':
        newRange = getThisMonthRange();
        break;
      case 'lastMonth':
        newRange = getLastMonthRange();
        break;
      default:
        newRange = getThisMonthRange();
    }
    setRange(newRange);
  }, [setRange]);

  return (
    <DateRangeContext.Provider value={{ selectedRange, setRange, goToPreviousPeriod, goToNextPeriod, setQuickPeriod }}>
      {children}
    </DateRangeContext.Provider>
  );
};

// Custom hook to use the date range context
export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};