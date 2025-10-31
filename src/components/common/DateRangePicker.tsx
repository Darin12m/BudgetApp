"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDateRange } from "@/context/DateRangeContext";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  const { t } = useTranslation();
  const { selectedRange, setRange } = useDateRange(); // Use setRange from context

  const handleSelectChange = (value: string) => {
    const today = new Date();
    let newRange: DateRange | undefined;
    let label: string;

    switch (value) {
      case "today":
        newRange = { from: today, to: today };
        label = format(today, 'MMM dd, yyyy');
        break;
      case "yesterday":
        const yesterday = addDays(today, -1);
        newRange = { from: yesterday, to: yesterday };
        label = format(yesterday, 'MMM dd, yyyy');
        break;
      case "last7days":
        newRange = { from: addDays(today, -6), to: today };
        label = `${format(addDays(today, -6), 'MMM dd')} - ${format(today, 'MMM dd, yyyy')}`;
        break;
      case "last30days":
        newRange = { from: addDays(today, -29), to: today };
        label = `${format(addDays(today, -29), 'MMM dd')} - ${format(today, 'MMM dd, yyyy')}`;
        break;
      case "thismonth":
        newRange = { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
        label = format(today, 'MMMM yyyy');
        break;
      case "lastmonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        newRange = { from: lastMonthStart, to: lastMonthEnd };
        label = format(lastMonthStart, 'MMMM yyyy');
        break;
      case "thisyear":
        newRange = { from: new Date(today.getFullYear(), 0, 1), to: today };
        label = format(today, 'yyyy');
        break;
      case "alltime":
        newRange = undefined; // Represents all time
        label = t("dateRangePicker.allTime");
        break;
      default:
        newRange = undefined;
        label = t("dateRangePicker.selectDateRange");
    }
    setRange(newRange ? { ...newRange, label } : undefined);
  };

  const displayLabel = selectedRange?.label || t("dateRangePicker.selectDateRange");

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="default" // Set variant to default
            className={cn(
              "w-full justify-start text-left font-normal px-4 py-2 min-h-[44px]", // Removed glassmorphic-card
              !selectedRange?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 glassmorphic-card" align="start">
          <Select
            onValueChange={handleSelectChange}
            value={
              selectedRange?.from && selectedRange.to
                ? (selectedRange.from.toDateString() === selectedRange.to.toDateString() && selectedRange.from.toDateString() === new Date().toDateString() ? "today" :
                  selectedRange.from.toDateString() === addDays(new Date(), -1).toDateString() && selectedRange.to.toDateString() === addDays(new Date(), -1).toDateString() ? "yesterday" :
                  format(selectedRange.from, "yyyy-MM-dd") === format(addDays(new Date(), -6), "yyyy-MM-dd") && format(selectedRange.to, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "last7days" :
                  format(selectedRange.from, "yyyy-MM-dd") === format(addDays(new Date(), -29), "yyyy-MM-dd") && format(selectedRange.to, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "last30days" :
                  format(selectedRange.from, "yyyy-MM-dd") === format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd") && format(selectedRange.to, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "thismonth" :
                  format(selectedRange.from, "yyyy-MM-dd") === format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), "yyyy-MM-dd") && format(selectedRange.to, "yyyy-MM-dd") === format(new Date(new Date().getFullYear(), new Date().getMonth(), 0), "yyyy-MM-dd") ? "lastmonth" :
                  format(selectedRange.from, "yyyy-MM-dd") === format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd") && format(selectedRange.to, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "thisyear" :
                  "custom")
                : "alltime"
            }
          >
            <SelectTrigger className="m-2 w-[calc(100%-1rem)] bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <SelectValue placeholder={t("dateRangePicker.selectDateRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("dateRangePicker.today")}</SelectItem>
              <SelectItem value="yesterday">{t("dateRangePicker.yesterday")}</SelectItem>
              <SelectItem value="last7days">{t("dateRangePicker.last7days")}</SelectItem>
              <SelectItem value="last30days">{t("dateRangePicker.last30days")}</SelectItem>
              <SelectItem value="thismonth">{t("dateRangePicker.thisMonth")}</SelectItem>
              <SelectItem value="lastmonth">{t("dateRangePicker.lastMonth")}</SelectItem>
              <SelectItem value="thisyear">{t("dateRangePicker.thisYear")}</SelectItem>
              <SelectItem value="alltime">{t("dateRangePicker.allTime")}</SelectItem>
              <SelectItem value="custom">{t("dateRangePicker.selectDateRange")}</SelectItem>
            </SelectContent>
          </Select>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedRange?.from}
            selected={selectedRange}
            onSelect={(range: DateRange | undefined) => setRange(range ? { ...range, label: selectedRange?.label || '' } : undefined)}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}