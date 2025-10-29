"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface CustomActiveShapeProps extends PieSectorDataItem {
}

const DefaultCustomActiveShape: React.FC<CustomActiveShapeProps> = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-150 ease-out"
        style={{ filter: `drop-shadow(0 0 8px ${fill}80)` }}
      />
    </g>
  );
};

interface DonutChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

interface DonutWithCenterTextProps {
  mainValue: number | string;
  mainLabel?: string;
  data: DonutChartData[];
  innerRadius?: number;
  outerRadius?: number;
  chartId: string;
  formatValue?: (value: number, options?: Intl.NumberFormatOptions) => string;
  tooltipFormatter?: (value: number, name: string, props: any) => [string, string];
  activeShape?: React.ComponentType<any>;
  className?: string;
  mainTextColorClass?: string;
  mainFontWeightClass?: string;
  subTextColorClass?: string;
  subFontWeightClass?: string;
  startAngle?: number;
  endAngle?: number;
  paddingAngle?: number;
  strokeWidth?: number;
  strokeColor?: string;
  backgroundFill?: string;
  isOverBudget?: boolean;
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
  mainTextColorClass = 'text-foreground',
  mainFontWeightClass = 'font-bold',
  subTextColorClass = 'text-muted-foreground',
  subFontWeightClass = 'font-normal',
  startAngle,
  endAngle,
  paddingAngle,
  strokeWidth,
  strokeColor,
  backgroundFill,
  isOverBudget = false,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { formatCurrency } = useCurrency();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const calculateFontSize = useCallback((text: string, containerDiameter: number, maxPx: number, minPx: number, charFactor: number) => {
    if (!text) return minPx;
    const textLength = text.length;
    const lengthFactor = Math.log(textLength + 1) / Math.log(2);
    const calculatedSize = (containerDiameter / (lengthFactor * charFactor));
    return Math.max(minPx, Math.min(maxPx, calculatedSize));
  }, []);

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
                x: e.activeCoordinate.x + 30,
                y: e.activeCoordinate.y - 30,
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
                fill={entry.color || `hsl(var(--primary))`}
                style={{ filter: `drop-shadow(0 0 8px ${entry.color || `hsl(var(--primary))`}60)` }}
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
              color: 'hsl(var(--foreground))',
              borderRadius: '10px',
              border: '1px solid hsl(var(--border))',
              padding: '10px 12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
            itemStyle={{
              color: 'hsl(var(--foreground))',
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

      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-y-1"
        style={{
          width: `${textContainerDiameter}px`,
          height: `${textContainerDiameter}px`,
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