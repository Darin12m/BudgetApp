"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import RechartsTooltip from '@/components/common/RechartsTooltip'; // Reusing existing tooltip

interface AllocationData {
  name: string;
  value: number;
  fill?: string; // Recharts uses 'fill' for color
}

interface RadialAllocationChartProps {
  data: AllocationData[];
  totalValue: number;
  mainLabel?: string;
  chartId: string;
  innerRadius?: number;
  outerRadius?: number;
  barSize?: number;
  formatValue?: (value: number, options?: Intl.NumberFormatOptions) => string;
  tooltipFormatter?: (value: number, name: string, props: any) => [string, string];
  className?: string;
  mainTextColorClass?: string;
  mainFontWeightClass?: string;
  subTextColorClass?: string;
  subFontWeightClass?: string;
  gradientColors?: string[]; // Array of CSS variables or hex codes
}

const RadialAllocationChart: React.FC<RadialAllocationChartProps> = ({
  data,
  totalValue,
  mainLabel,
  chartId,
  innerRadius = 60,
  outerRadius = 90,
  barSize = 10,
  formatValue,
  tooltipFormatter,
  className,
  mainTextColorClass = 'text-foreground',
  mainFontWeightClass = 'font-bold',
  subTextColorClass = 'text-muted-foreground',
  subFontWeightClass = 'font-normal',
  gradientColors = ['hsl(var(--gradient-start))', 'hsl(var(--gradient-middle))', 'hsl(var(--gradient-end))'],
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      fill: item.fill || gradientColors[index % gradientColors.length], // Use provided fill or cycle through gradientColors
    }));
  }, [data, gradientColors]);

  const textContainerDiameter = innerRadius * 2 * 0.8;
  const mainTextFontSize = (size: number) => Math.max(10, Math.min(28, size / (String(totalValue).length > 5 ? 2.5 : 1.5)));
  const subTextFontSize = (size: number) => Math.max(8, Math.min(16, size / (String(mainLabel).length > 10 ? 4 : 2.5)));

  return (
    <motion.div
      className={cn("relative w-full h-full flex items-center justify-center", className)}
      whileHover={{ rotateX: 3, rotateY: -3, scale: 1.03 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          barSize={barSize}
          data={processedData}
          startAngle={90}
          endAngle={-270}
        >
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={<RechartsTooltip formatValue={formatValue || formatCurrency} />}
          />
          <RadialBar
            minAngle={15}
            label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
            background={{ fill: 'hsl(var(--muted)/50%)' }}
            dataKey="value"
            cornerRadius={barSize / 2}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {value} ({processedData.find(d => d.name === value)?.percentage.toFixed(0)}%)
              </span>
            )}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-y-1"
        style={{
          width: `${outerRadius * 2}px`,
          height: `${outerRadius * 2}px`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <span
          className={cn(mainTextColorClass, mainFontWeightClass, "text-center font-mono")}
          style={{ fontSize: `${mainTextFontSize(outerRadius * 2)}px`, lineHeight: 1 }}
        >
          {formatValue ? formatValue(totalValue) : formatCurrency(totalValue)}
        </span>
        {mainLabel && (
          <span
            className={cn(subTextColorClass, subFontWeightClass, "text-center")}
            style={{ fontSize: `${subTextFontSize(outerRadius * 2)}px`, lineHeight: 1 }}
          >
            {mainLabel}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default RadialAllocationChart;