"use client";

import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
  const { formatCurrency } = useCurrency();

  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      fill: item.color || palette[index % palette.length],
    }));
  }, [data, palette]);

  const displayedTotalLabel = totalLabel || t("dashboard.totalAllocated");

  // Calculate font sizes dynamically to prevent overlap
  const calculateFontSize = useCallback((text: string, containerWidth: number, maxFontSize: number, minFontSize: number, charWidthFactor: number) => {
    const estimatedTextWidth = text.length * charWidthFactor; // Rough estimate
    const availableWidth = containerWidth * 0.8; // Use 80% of container width
    if (estimatedTextWidth > availableWidth) {
      return Math.max(minFontSize, maxFontSize * (availableWidth / estimatedTextWidth));
    }
    return maxFontSize;
  }, []);

  const containerDiameter = outerRadius * 2;
  const totalValueText = formatCurrency(totalValue);

  // Adjusted font sizes for better visual balance
  const mainFontSize = calculateFontSize(totalValueText, containerDiameter, 24, 10, 0.6);
  const subLabelFontSize = calculateFontSize(displayedTotalLabel, containerDiameter, 14, 8, 0.5);

  return (
    <motion.div
      className={cn("relative w-full h-full flex items-center justify-center", className)}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      role="img"
      aria-label={`${displayedTotalLabel}: ${totalValueText} with allocation details.`}
    >
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
      <div
        className="absolute flex flex-col items-center justify-center pointer-events-none"
        style={{
          // Position relative to the center of the donut
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)', // Perfect centering
          width: `${innerRadius * 2 * 0.9}px`, // Constrain width to inner circle for text wrapping
          textAlign: 'center',
        }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          className={cn(mainTextColorClass, mainFontWeightClass, "font-mono")}
          style={{ fontSize: `${mainFontSize}px`, lineHeight: 1.2 }} // Adjusted line-height
        >
          {totalValueText}
        </motion.span>
        {displayedTotalLabel && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
            className={cn(subTextColorClass, subFontWeightClass)}
            style={{ fontSize: `${subLabelFontSize}px`, lineHeight: 1.2, marginTop: '4px' }} // Small offset for sublabel
          >
            {displayedTotalLabel}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
});

export default ProDonut;