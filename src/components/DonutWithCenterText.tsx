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
  mainTextColorClass = 'text-foreground', // Changed to text-foreground
  mainFontWeightClass = 'font-bold',
  subTextColorClass = 'text-muted-foreground', // Changed to text-muted-foreground
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Dynamic font sizing for the center text
  const calculateFontSize = useCallback((text: string, containerDiameter: number, maxPx: number, minPx: number, charFactor: number) => {
    if (!text) return minPx;
    const textLength = text.length;
    const lengthFactor = Math.log(textLength + 1) / Math.log(2);
    const calculatedSize = (containerDiameter / (lengthFactor * charFactor));
    return Math.max(minPx, Math.min(maxPx, calculatedSize));
  }, []);

  // Adjusted to 80% of inner diameter for more padding
  const textContainerDiameter = innerRadius * 2 * 0.8; 
  const mainTextFontSize = calculateFontSize(String(mainValue), textContainerDiameter, 28, 10, 1.5);
  const subTextFontSize = calculateFontSize(String(mainLabel), textContainerDiameter, 16, 8, 1.8);

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
          onMouseMove={(e) => {
            if (e && e.activeCoordinate) {
              setMousePos({
                x: e.activeCoordinate.x + 30, // 30px to the right of cursor
                y: e.activeCoordinate.y - 30, // slightly above cursor
              });
            }
          }}
        >
          <defs>
            {data.map((entry, index) => {
              if (entry.color && entry.color.startsWith('url(#')) {
                return null;
              }
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
            cursor={false}
            position={mousePos}
            wrapperStyle={{
              pointerEvents: 'none',
              transition: 'transform 0.1s ease-out',
              transform: 'translateY(-5px)',
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))', // Changed to foreground
              borderRadius: '10px',
              border: '1px solid hsl(var(--border))', // Changed to border
              padding: '10px 12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
            itemStyle={{
              color: 'hsl(var(--foreground))', // Changed to foreground
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
            formatter={(value: number) =>
              formatValue ? formatValue(value) : `$${Number(value).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`
            }
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Central Text Overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-y-1" // Added gap-y-1 here
        style={{
          width: `${textContainerDiameter}px`, // Corrected to use textContainerDiameter
          height: `${textContainerDiameter}px`, // Corrected to use textContainerDiameter
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