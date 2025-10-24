"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react"; // Removed ChevronLeft and ChevronRight
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, addMonths, subWeeks, addWeeks, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateRange } from "@/context/DateRangeContext"; // Import the context

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  const { selectedRange, setRange, setQuickPeriod } = useDateRange(); // Removed goToPreviousPeriod, goToNextPeriod
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
      setRange({ from: undefined, to: undefined, label: 'Select Date Range' });
    }
  };

  const generateLabel = (from: Date | undefined, to: Date | undefined): string => {
    if (!from && !to) return 'Select Date Range';
    if (from && !to) return format(from, 'MMM dd, yyyy');
    if (!from && to) return format(to, 'MMM dd, yyyy');

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
      {/* Removed Previous Period Button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]",
              !selectedRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRange.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border border-border/50 card-shadow backdrop-blur-lg" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-col p-4 border-b sm:border-b-0 sm:border-r border-border/50">
              <Button variant="ghost" onClick={() => setQuickPeriod('today')} className="justify-start">Today</Button>
              <Button variant="ghost" onClick={() => setQuickPeriod('thisWeek')} className="justify-start">This Week</Button>
              <Button variant="ghost" onClick={() => setQuickPeriod('thisMonth')} className="justify-start">This Month</Button>
              <Button variant="ghost" onClick={() => setQuickPeriod('lastMonth')} className="justify-start">Last Month</Button>
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
      {/* Removed Next Period Button */}
    </div>
  );
}