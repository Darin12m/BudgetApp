"use client";

import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { cn, formatCompactCurrency } from '@/lib/utils'; // Import formatCompactCurrency
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import RechartsTooltip from '@/components/common/RechartsTooltip'; // Reusing existing tooltip

interface ProDonutData {
  name: string;
  value: number;
  color?: string; // Optional custom color for a segment
}

interface ProDonutProps {
  data: ProDonutData[];
  totalValue: number;
  totalLabel?: string; // default: "Total Allocated"
  chartId: string; // Unique ID for gradients
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  mainTextColorClass?: string;
  mainFontWeightClass?: string;
  subTextColorClass?: string;
  subFontWeightClass?: string;
  palette?: string[]; // Custom color palette
}

const DEFAULT_PALETTE = [
  'hsl(var(--blue))',
  'hsl(var(--emerald))',
  'hsl(var(--lilac))',
  'hsl(25 95% 53%)', // Amber
  'hsl(220 70% 50%)', // Indigo
  'hsl(340 80% 60%)', // Pink
  'hsl(175 70% 40%)', // Cyan
  'hsl(60 90% 50%)',  // Yellow
];

const ProDonut: React.FC<ProDonutProps> = memo(({
  data,
  totalValue,
  totalLabel,
  chartId,
  innerRadius = 60,
  outerRadius = 90,
  className,
  mainTextColorClass = 'text-foreground',
  mainFontWeightClass = 'font-bold',
  subTextColorClass = 'text-muted-foreground',
  subFontWeightClass = 'font-normal',
  palette = DEFAULT_PALETTE,
}) => {
  const { t } = useTranslation();
  const { formatCurrency, selectedCurrency } = useCurrency();

  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      fill: item.color || palette[index % palette.length],
    }));
  }, [data, palette]);

  const displayedTotalLabel = totalLabel || t("dashboard.totalAllocated");
  const formattedTotalValue = formatCompactCurrency(totalValue, selectedCurrency.symbol); // Use compact formatter

  return (
    <motion.div
      className={cn("relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center", className)} // Responsive container
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      role="img"
      aria-label={`${displayedTotalLabel}: ${formattedTotalValue} with allocation details.`}
    >
      {/* Background gradient halo */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-primary/30 via-lilac/30 to-emerald/30 animate-pulse-glow"
        style={{
          width: outerRadius * 2 * 1.1, // Slightly larger than outerRadius
          height: outerRadius * 2 * 1.1,
          filter: 'blur(15px)', // Soft blur effect
          zIndex: -1, // Behind the chart
        }}
        initial={{ opacity: 0.5, scale: 0.9 }}
        animate={{ opacity: 0.8, scale: 1.0 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            paddingAngle={3} // Slightly reduced padding for a fuller look
            dataKey="value"
            nameKey="name"
            cornerRadius={5} // Rounded corners for segments
            isAnimationActive={true}
            animationDuration={1000} // 1 second animation
            animationEasing="ease-out"
            stroke="none" // Remove stroke to prevent lines between segments
            strokeLinecap="round" // Rounded ends for segments
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} aria-label={`${entry.name}: ${entry.percentage.toFixed(0)}%`} />
            ))}
          </Pie>
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={<RechartsTooltip formatValue={formatCurrency} />}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Centered Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center pointer-events-none"> {/* Absolute container for text */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          className={cn(mainTextColorClass, mainFontWeightClass, "font-mono text-balance text-[clamp(0.7rem,2.4vw,1rem)] leading-tight")} // Clamped text size
        >
          {formattedTotalValue}
        </motion.span>
        {displayedTotalLabel && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
            className={cn(subTextColorClass, subFontWeightClass, "caption text-balance text-[clamp(0.6rem,1.8vw,0.8rem)] leading-tight")} // Clamped text size
          >
            {displayedTotalLabel}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
});

export default ProDonut;