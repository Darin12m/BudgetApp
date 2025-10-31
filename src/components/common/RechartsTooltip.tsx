"use client";

import React from 'react';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Card } from '@/components/ui/card'; // Import Card

interface RechartsTooltipProps extends TooltipProps<ValueType, NameType> {
  formatValue: (value: number, options?: Intl.NumberFormatOptions) => string;
  nameFormatter?: (name: NameType) => React.ReactNode;
}

const RechartsTooltip: React.FC<RechartsTooltipProps> = ({
  active,
  payload,
  label,
  formatValue,
  nameFormatter,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  if (active && payload && payload.length) {
    return (
      <Card className={cn(
        "rounded-lg border bg-tooltip-bg p-3 text-sm shadow-lg",
        "border-tooltip-border-color text-tooltip-text-color"
      )}> {/* Applied consistent card style */}
        <p className="font-semibold text-sm mb-1">{label}</p> {/* Applied consistent typography */}
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between">
            <span className="text-sm mr-2" style={{ color: entry.color as string }}> {/* Applied consistent typography */}
              {nameFormatter ? nameFormatter(entry.name) : entry.name}:
            </span>
            <span className="font-medium text-sm"> {/* Applied consistent typography */}
              {formatValue(Number(entry.value))}
            </span>
          </div>
        ))}
      </Card>
    );
  }

  return null;
};

export default RechartsTooltip;