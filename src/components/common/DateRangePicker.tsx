"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, addMonths, subWeeks, addWeeks, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateRange } from "@/context/DateRangeContext";
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  const { t } = useTranslation();
  const { selectedRange, setRange, setQuickPeriod } = useDateRange();
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(selectedRange.from || new Date());

  // Update calendar month when selectedRange.from changes
  React.useEffect(() => {
    if (selectedRange.from) {
      setCalendarMonth(selectedRange.from);
    }
  }, [selectedRange.from]);

  const handleDateSelect = (newRange: DateRange | undefined) => {
    if (newRange?.from && newRange?.to) {
      setRange({
        from: startOfDay(newRange.from),
        to: endOfDay(newRange.to),
        label: generateLabel(newRange.from, newRange.to),
      });
    } else if (newRange?.from) {
      // If only 'from' is selected, treat as single day
      setRange({
        from: startOfDay(newRange.from),
        to: endOfDay(newRange.from),
        label: generateLabel(newRange.from, newRange.from),
      });
    } else {
      setRange({ from: undefined, to: undefined, label: t("dateRangePicker.selectDateRange") });
    }
  };

  const generateLabel = (from: Date | undefined, to: Date | undefined): string => {
    if (!from && !to) return t("dateRangePicker.selectDateRange");
    if (from && !to) return format(from!, 'MMM dd, yyyy');
    if (!from && to) return format(to!, 'MMM dd, yyyy');

    // If both are defined
    if (format(from!, 'yyyy-MM-dd') === format(to!, 'yyyy-MM-dd')) {
      return format(from!, 'MMM dd, yyyy');
    }
    if (format(from!, 'yyyy-MM') === format(to!, 'yyyy-MM')) {
      return format(from!, 'MMMM yyyy');
    }
    return `${format(from!, 'MMM dd, yyyy')} - ${format(to!, 'MMM dd, yyyy')}`;
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "var(--tw-shadow-glass-sm)" }}
            whileTap={{ scale: 0.98 }}
            id="date"
            className={cn(
              "w-full justify-start text-left font-normal glassmorphic-card px-4 py-2 min-h-[44px]", // Applied glassmorphic-card
              !selectedRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRange.label}
          </motion.button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 glassmorphic-card" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-col p-4 border-b sm:border-b-0 sm:border-r border-border/50">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} variant="ghost" onClick={() => setQuickPeriod('today')} className="justify-start">{t("dateRangePicker.today")}</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} variant="ghost" onClick={() => setQuickPeriod('thisWeek')} className="justify-start">{t("dateRangePicker.thisWeek")}</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} variant="ghost" onClick={() => setQuickPeriod('thisMonth')} className="justify-start">{t("dateRangePicker.thisMonth")}</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} variant="ghost" onClick={() => setQuickPeriod('lastMonth')} className="justify-start">{t("dateRangePicker.lastMonth")}</motion.button>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={calendarMonth}
              selected={{ from: selectedRange.from, to: selectedRange.to }}
              onSelect={handleDateSelect}
              numberOfMonths={1}
              onMonthChange={setCalendarMonth}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}