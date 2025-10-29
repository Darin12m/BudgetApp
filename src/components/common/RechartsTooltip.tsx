"use client";

import React from 'react';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next'; // Import useTranslation

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
      <div className={cn(
        "rounded-lg border bg-tooltip-bg p-3 text-sm shadow-lg",
        "border-tooltip-border-color text-tooltip-text-color"
      )}>
        <p className="font-semibold p mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between">
            <span className="p mr-2" style={{ color: entry.color as string }}>
              {nameFormatter ? nameFormatter(entry.name) : entry.name}:
            </span>
            <span className="font-medium p">
              {formatValue(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default RechartsTooltip;