"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency for formatting

// Define props interface for CustomActiveShape
interface CustomActiveShapeProps extends PieSectorDataItem {
  // Add any other props you might be passing or that recharts provides
}

// Default Custom Active Shape for hover effect on Donut Chart
const DefaultCustomActiveShape: React.FC<CustomActiveShapeProps> = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // Slightly larger on hover
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-150 ease-out"
        style={{ filter: `drop-shadow(0 0 8px ${fill}80)` }} // Enhanced glow
      />
    </g>
  );
};

interface DonutChartData {
  name: string;
  value: number;
  color?: string; // Can be a solid color or a URL to an SVG gradient
  percentage?: number; // Optional, can be calculated
}

interface DonutWithCenterTextProps {
  mainValue: number | string; // Main text for the center (e.g., total, percentage)
  mainLabel?: string; // Optional label under the main value
  data: DonutChartData[]; // Data for the PieChart segments
  innerRadius?: number;
  outerRadius?: number;
  chartId: string; // Unique ID for gradients and accessibility
  formatValue?: (value: number, options?: Intl.NumberFormatOptions) => string; // Function to format numeric values
  tooltipFormatter?: (value: number, name: string, props: any) => [string, string]; // Custom formatter for tooltip
  activeShape?: React.ComponentType<any>; // Custom Active Shape component
  className?: string; // Additional classes for the outer div
  mainTextColorClass?: string; // Tailwind class for main text color
  mainFontWeightClass?: string; // Tailwind class for main text font weight
  subTextColorClass?: string; // Tailwind class for sub text color
  subFontWeightClass?: string; // Tailwind class for sub text font weight
  startAngle?: number; // Start angle for the pie chart (e.g., 90 for top)
  endAngle?: number; // End angle for the pie chart (e.g., -270 for full circle from top)
  paddingAngle?: number; // Padding between slices
  strokeWidth?: number; // Stroke width for the pie segments
  strokeColor?: string; // Stroke color for the pie segments
  backgroundFill?: string; // Fill color for the background circle (if any)
  isOverBudget?: boolean; // For conditional styling/animation
}

const DonutWithCenterText: React.FC<DonutWithCenterTextProps> = ({
  mainValue,
  mainLabel,
  data,
  innerRadius = 60,
  outerRadius = 90,
  chartId,
  formatValue,
  tooltipFormatter,
  activeShape: CustomActiveShape = DefaultCustomActiveShape,
  className,
  mainTextColorClass = 'text-white',
  mainFontWeightClass = 'font-bold',
  subTextColorClass = 'text-white',
  subFontWeightClass = 'font-normal',
  startAngle,
  endAngle,
  paddingAngle,
  strokeWidth,
  strokeColor,
  backgroundFill,
  isOverBudget = false,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { formatCurrency } = useCurrency(); // Use formatCurrency from context

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Calculate total value for percentage calculation in tooltip if not provided
  const totalValue = useMemo(() => data.reduce((sum, entry) => sum + entry.value, 0), [data]);

  // Dynamic font sizing for the center text
  const calculateFontSize = useCallback((text: string, containerDiameter: number, maxPx: number, minPx: number, charFactor: number) => {
    if (!text) return minPx;
    const textLength = text.length;
    // A heuristic: scale font size based on text length relative to available diameter
    // Adjust charFactor for desired visual density.
    // Using a logarithmic scale for length to handle very long numbers better.
    const lengthFactor = Math.log(textLength + 1) / Math.log(2); // log base 2
    const calculatedSize = (containerDiameter / (lengthFactor * charFactor));
    return Math.max(minPx, Math.min(maxPx, calculatedSize));
  }, []);

  const textContainerDiameter = innerRadius * 2 * 0.9; // 90% of inner diameter for text
  const mainTextFontSize = calculateFontSize(String(mainValue), textContainerDiameter, 28, 10, 1.5);
  const subTextFontSize = calculateFontSize(String(mainLabel), textContainerDiameter, 16, 8, 1.8);

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart onMouseEnter={onPieEnter} onMouseLeave={onPieLeave}>
          <defs>
            {data.map((entry, index) => {
              // Check if color is a gradient URL, otherwise assume solid color
              if (entry.color && entry.color.startsWith('url(#')) {
                // If it's already a URL, we don't need to define a new gradient here
                return null;
              }
              // If it's a solid color, we can create a simple gradient for consistency or just use it directly
              // For now, let's assume solid colors are passed directly to Cell fill
              return null;
            })}
          </defs>

          {/* Background circle if specified */}
          {backgroundFill && (
            <Pie
              data={[{ name: 'background', value: 100, color: backgroundFill }]}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              fill={backgroundFill}
              dataKey="value"
              isAnimationActive={false}
              stroke="none"
            />
          )}

          {/* Main Data Ring */}
          <Pie
            activeIndex={activeIndex !== null ? activeIndex : undefined}
            activeShape={activeIndex !== null ? (props: PieSectorDataItem) => <CustomActiveShape {...props} /> : undefined}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            paddingAngle={paddingAngle}
            dataKey="value"
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className={cn(isOverBudget && 'animate-pulse-red-glow')}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${chartId}-${index}`}
                fill={entry.color || `hsl(var(--primary))`} // Use entry color or default
                style={{ filter: `drop-shadow(0 0 8px ${entry.color || `hsl(var(--primary))`}60)` }} // Soft glow
              />
            ))}
          </Pie>
          <Tooltip
            offset={10}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const entry = payload[0].payload; // Get the actual data entry
                const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
                return (
                  <div className="rounded-lg border bg-tooltip-bg p-3 text-sm shadow-lg border-tooltip-border-color text-tooltip-text-color">
                    <p className="font-semibold mb-1">{entry.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="mr-2" style={{ color: entry.color as string }}>
                        Value:
                      </span>
                      <span className="font-medium">
                        {formatValue ? formatValue(entry.value) : entry.value}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="mr-2">
                        Percentage:
                      </span>
                      <span className="font-medium">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Central Text Overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{
          width: `${outerRadius * 2}px`, // Use outerRadius to define the container size
          height: `${outerRadius * 2}px`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <span
          className={cn(mainTextColorClass, mainFontWeightClass, "text-center")}
          style={{ fontSize: `${mainTextFontSize}px`, lineHeight: 1 }}
        >
          {mainValue}
        </span>
        {mainLabel && (
          <span
            className={cn(subTextColorClass, subFontWeightClass, "text-center")}
            style={{ fontSize: `${subTextFontSize}px`, lineHeight: 1 }}
          >
            {mainLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default DonutWithCenterText;