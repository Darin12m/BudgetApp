"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import DynamicTextInCircle from '@/components/common/DynamicTextInCircle';
import { cn } from '@/lib/utils';

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

interface DonutChartWithCentralTextProps {
  data: any[]; // Data for the PieChart
  mainText: string; // Main text for the center
  subText?: string; // Sub text for the center
  innerRadius: number;
  outerRadius: number;
  chartId: string; // Unique ID for gradients
  formatValue: (value: number, options?: Intl.NumberFormatOptions) => string; // Function to format values
  tooltipContent?: React.ComponentType<any>; // Custom Tooltip content component
  activeShape?: React.ComponentType<any>; // Custom Active Shape component
  // Specific props for Budget/Remaining card
  totalBudgeted?: number;
  totalSpent?: number;
  remainingBudget?: number;
  isOverBudget?: boolean;
  spentPercentage?: number;
  // Specific props for Portfolio card
  totalPortfolioValue?: number;
  // Additional props for DynamicTextInCircle
  mainTextColorClass?: string;
  subTextColorClass?: string;
  mainFontWeightClass?: string;
  subFontWeightClass?: string;
  className?: string; // Additional classes for the outer div
  pieChartClassName?: string; // Additional classes for the PieChart
}

const DonutChartWithCentralText: React.FC<DonutChartWithCentralTextProps> = ({
  data,
  mainText,
  subText,
  innerRadius,
  outerRadius,
  chartId,
  formatValue,
  tooltipContent: CustomTooltipContent,
  activeShape: CustomActiveShape = DefaultCustomActiveShape,
  totalBudgeted,
  totalSpent,
  remainingBudget,
  isOverBudget,
  spentPercentage,
  totalPortfolioValue,
  mainTextColorClass,
  subTextColorClass,
  mainFontWeightClass,
  subFontWeightClass,
  className,
  pieChartClassName,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Calculate the effective diameter for the text container based on inner radius
  const textContainerDiameter = innerRadius * 2;

  // Determine colors for gradients based on chartId
  const gradientPrimaryColor1 = chartId === 'budget' ? 'hsl(var(--blue))' : 'hsl(var(--blue))';
  const gradientPrimaryColor2 = chartId === 'budget' ? 'hsl(var(--primary))' : 'hsl(var(--primary))';
  const gradientStrokeColor1 = chartId === 'budget' ? 'hsl(var(--blue))' : 'hsl(var(--blue))';
  const gradientStrokeColor2 = chartId === 'budget' ? 'hsl(var(--primary))' : 'hsl(var(--primary))';
  const emeraldColor = 'hsl(var(--emerald))';
  const mutedColor = 'hsl(var(--muted)/50%)';

  // Background ring data (always 100%)
  const backgroundPieData = useMemo(() => [{ name: 'Background', value: 100, color: mutedColor }], [mutedColor]);

  const pieDataWithColors = useMemo(() => {
    if (chartId === 'budget') {
      // For budget chart, data is already percentages
      return [
        { name: 'Spent', value: data[0]?.value, color: `url(#gradientPrimary-${chartId})` },
        { name: 'Remaining', value: data[1]?.value, color: emeraldColor },
      ];
    }
    // For other charts (e.g., portfolio allocation), data comes with colors
    return data.map((entry, index) => ({
      ...entry,
      color: entry.color || `url(#gradientPrimary-${chartId}-${index})`, // Use existing color or generate
    }));
  }, [data, chartId, emeraldColor]);


  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart onMouseEnter={onPieEnter} onMouseLeave={onPieLeave} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} className={pieChartClassName}>
          <defs>
            {/* Gradient for main spent portion (Budget/Remaining) */}
            {chartId === 'budget' && (
              <>
                <linearGradient id={`gradientPrimary-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientPrimaryColor1} />
                  <stop offset="100%" stopColor={gradientPrimaryColor2} />
                </linearGradient>
                <linearGradient id={`gradientStroke-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientStrokeColor1} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={gradientStrokeColor2} stopOpacity={0.8} />
                </linearGradient>
              </>
            )}
            {/* Gradients for Portfolio Allocation (each slice might have its own color) */}
            {chartId === 'portfolio' && pieDataWithColors.map((entry, index) => (
              <linearGradient key={`grad-${chartId}-${index}`} id={`color-${chartId}-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={entry.color} stopOpacity={0.5}/>
              </linearGradient>
            ))}
          </defs>

          {/* Background Ring for depth (only for budget/remaining) */}
          {chartId === 'budget' && (
            <Pie
              data={backgroundPieData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              fill={mutedColor}
              dataKey="value"
              isAnimationActive={false}
              stroke="none"
            />
          )}

          {/* Main Data Ring */}
          <Pie
            activeIndex={activeIndex !== null ? activeIndex : undefined}
            activeShape={activeIndex !== null ? (props: PieSectorDataItem) => <CustomActiveShape {...props} /> : undefined}
            data={pieDataWithColors}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={chartId === 'budget' ? 90 : undefined} // Start angle for budget chart
            endAngle={chartId === 'budget' ? -270 : undefined} // End angle for budget chart
            paddingAngle={chartId === 'portfolio' ? 2 : 0} // Padding for portfolio slices
            dataKey="value"
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
            stroke={chartId === 'budget' ? `url(#gradientStroke-${chartId})` : undefined} // Stroke for budget chart
            strokeWidth={chartId === 'budget' ? 2 : 1} // Thin stroke for budget chart
            className={cn(
              isOverBudget && 'animate-pulse-red-glow' // Apply pulsing glow if over budget
            )}
            labelLine={chartId === 'portfolio' ? false : undefined} // No label line for portfolio
          >
            {pieDataWithColors.map((entry, index) => (
              <Cell
                key={`cell-${chartId}-${index}`}
                fill={chartId === 'portfolio' ? `url(#color-${chartId}-${index})` : entry.color}
                style={{ filter: `drop-shadow(0 0 8px ${entry.color}60)` }} // Soft glow
              />
            ))}
          </Pie>
          <Tooltip
            offset={10}
            content={CustomTooltipContent ? (
              <CustomTooltipContent
                totalBudgeted={totalBudgeted}
                totalSpent={totalSpent}
                remainingBudget={remainingBudget}
                isOverBudget={isOverBudget}
                formatCurrency={formatValue}
                payload={data} // Pass original data to custom tooltip
                spentPercentage={spentPercentage}
                totalPortfolioValue={totalPortfolioValue}
              />
            ) : undefined}
            formatter={(value: number, name: string, props: any) => [
              formatValue(value),
              `${props.payload.name} (${props.payload.percentage ? props.payload.percentage.toFixed(0) : (value / totalPortfolioValue * 100).toFixed(0)}%)`
            ]}
            contentStyle={{
              fontSize: '12px',
              backgroundColor: 'hsl(var(--tooltip-bg))',
              border: '1px solid hsl(var(--tooltip-border-color))',
              borderRadius: '8px',
              color: 'hsl(var(--tooltip-text-color))',
              pointerEvents: 'none',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <DynamicTextInCircle
        mainText={mainText}
        subText={subText}
        containerSize={textContainerDiameter}
        maxFontSizePx={28}
        minFontSizePx={10}
        mainTextColorClass={mainTextColorClass}
        subTextColorClass={subTextColorClass}
        mainFontWeightClass={mainFontWeightClass}
        subFontWeightClass={subFontWeightClass}
      />
    </div>
  );
};

export default DonutChartWithCentralText;