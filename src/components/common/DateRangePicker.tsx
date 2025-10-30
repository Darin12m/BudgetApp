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
  const { selectedRange, setSelectedRange } = useDateRange();

  const handleSelectChange = (value: string) => {
    const today = new Date();
    let newRange: DateRange | undefined;

    switch (value) {
      case "today":
        newRange = { from: today, to: today };
        break;
      case "yesterday":
        const yesterday = addDays(today, -1);
        newRange = { from: yesterday, to: yesterday };
        break;
      case "last7days":
        newRange = { from: addDays(today, -6), to: today };
        break;
      case "last30days":
        newRange = { from: addDays(today, -29), to: today };
        break;
      case "thismonth":
        newRange = { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
        break;
      case "lastmonth":
        newRange = {
          from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
          to: new Date(today.getFullYear(), today.getMonth(), 0),
        };
        break;
      case "thisyear":
        newRange = { from: new Date(today.getFullYear(), 0, 1), to: today };
        break;
      case "alltime":
        newRange = undefined; // Represents all time
        break;
      default:
        newRange = undefined;
    }
    setSelectedRange(newRange);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="default" // Set variant to default
            className={cn(
              "w-full justify-start text-left font-normal px-4 py-2 min-h-[44px]", // Removed glassmorphic-card
              !selectedRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRange?.from ? (
              selectedRange.to ? (
                selectedRange.from.toDateString() === selectedRange.to.toDateString() ?
                  format(selectedRange.from, "LLL dd, y") :
                  `${format(selectedRange.from, "LLL dd, y")} - ${format(selectedRange.to, "LLL dd, y")}`
              ) : (
                format(selectedRange.from, "LLL dd, y")
              )
            ) : (
              <span>{t("dateRangePicker.pickADate")}</span>
            )}
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
              <SelectValue placeholder={t("dateRangePicker.select")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("dateRangePicker.today")}</SelectItem>
              <SelectItem value="yesterday">{t("dateRangePicker.yesterday")}</SelectItem>
              <SelectItem value="last7days">{t("dateRangePicker.last7Days")}</SelectItem>
              <SelectItem value="last30days">{t("dateRangePicker.last30Days")}</SelectItem>
              <SelectItem value="thismonth">{t("dateRangePicker.thisMonth")}</SelectItem>
              <SelectItem value="lastmonth">{t("dateRangePicker.lastMonth")}</SelectItem>
              <SelectItem value="thisyear">{t("dateRangePicker.thisYear")}</SelectItem>
              <SelectItem value="alltime">{t("dateRangePicker.allTime")}</SelectItem>
              <SelectItem value="custom">{t("dateRangePicker.customRange")}</SelectItem>
            </SelectContent>
          </Select>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedRange?.from}
            selected={selectedRange}
            onSelect={setSelectedRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}