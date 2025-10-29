"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next';

interface CircularProgressChartProps {
  value: number; // Percentage value (0-100)
  label?: string;
  size?: number; // Diameter of the circle
  strokeWidth?: number;
  progressColor?: string; // Tailwind color class or CSS variable
  backgroundColor?: string; // Tailwind color class or CSS variable
  textColorClass?: string;
  fontWeightClass?: string;
  labelColorClass?: string;
  labelFontWeightClass?: string;
  isOverBudget?: boolean; // For conditional styling
  formatValue?: (value: number, options?: Intl.NumberFormatOptions) => string;
  unit?: string; // e.g., "%"
}

const CircularProgressChart: React.FC<CircularProgressChartProps> = ({
  value,
  label,
  size = 120,
  strokeWidth = 10,
  progressColor = 'hsl(var(--primary))',
  backgroundColor = 'hsl(var(--muted)/50%)',
  textColorClass = 'text-foreground',
  fontWeightClass = 'font-bold',
  labelColorClass = 'text-muted-foreground',
  labelFontWeightClass = 'font-normal',
  isOverBudget = false,
  formatValue,
  unit = '%',
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [animatedValue, setAnimatedValue] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const duration = 1000; // 1 second animation

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }
    const elapsed = time - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const newAnimatedValue = value * progress;

    setAnimatedValue(newAnimatedValue);

    if (progress < 1) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [value, duration]);

  useEffect(() => {
    startTimeRef.current = undefined;
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [value, animate]);

  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  const displayedValue = formatValue ? formatValue(value) : `${Math.round(animatedValue)}${unit}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-200 dark:text-gray-700"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={cn(
            "transition-colors duration-300",
            isOverBudget ? "text-destructive" : ""
          )}
          stroke={isOverBudget ? 'hsl(var(--destructive))' : progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (value / 100) * circumference }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn(textColorClass, fontWeightClass, "text-center font-mono")} style={{ fontSize: size * 0.25, lineHeight: 1 }}>
          {displayedValue}
        </span>
        {label && (
          <span className={cn(labelColorClass, labelFontWeightClass, "text-center")} style={{ fontSize: size * 0.1, lineHeight: 1 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default CircularProgressChart;