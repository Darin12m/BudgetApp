"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next';

interface CustomActiveShapeProps extends PieSectorDataItem {
  fill: string;
}

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
        style={{ filter: `drop-shadow(0 0 8px ${fill}80)` }}
      />
    </g>
  );
};

interface SmartDonutChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

interface SmartDonutChartProps {
  mainValue: number | string;
  mainLabel?: string;
  data: SmartDonutChartData[];
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
  gradientColors?: string[]; // Array of Tailwind color classes or CSS variables
  animateGradientBorder?: boolean;
  showLegend?: boolean;
}

const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }
    const elapsed = time - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const newCount = end * progress;

    setCount(newCount);

    if (progress < 1) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      setCount(end);
    }
  }, [end, duration]);

  useEffect(() => {
    startTimeRef.current = undefined;
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [end, animate]);

  return count;
};


const SmartDonutChart: React.FC<SmartDonutChartProps> = ({
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
  startAngle = 90,
  endAngle = -270,
  paddingAngle = 2,
  strokeWidth = 1,
  strokeColor = "transparent",
  backgroundFill = "hsl(var(--muted)/50%)",
  isOverBudget = false,
  gradientColors = ['hsl(var(--gradient-start))', 'hsl(var(--gradient-middle))', 'hsl(var(--gradient-end))'],
  animateGradientBorder = false,
  showLegend = false,
}) => {
  const { t } = useTranslation();
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

  // Count-up animation for numeric mainValue
  const isNumericMainValue = typeof mainValue === 'number';
  const animatedMainValue = useCountUp(isNumericMainValue ? (mainValue as number) : 0, 1000);
  const displayedMainValue = isNumericMainValue ? formatCurrency(animatedMainValue) : mainValue;

  const gradientId = `donut-gradient-${chartId}`;
  const gradientStops = gradientColors.map((color, index) => (
    <stop key={index} offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} />
  ));

  return (
    <motion.div
      className={cn("relative w-full h-full flex items-center justify-center", className)}
      whileHover={{ rotateX: 3, rotateY: -3, scale: 1.03 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
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
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              {gradientStops}
            </linearGradient>
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
                fill={entry.color || `url(#${gradientId})`} // Use individual color or gradient
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
            formatter={(value: number, name: string) =>
              tooltipFormatter ? tooltipFormatter(value, name, {}) : [
                formatValue ? formatValue(value) : `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                name
              ]
            }
          />
          {showLegend && (
            <g>
              {data.map((entry, index) => (
                <text
                  key={`legend-${chartId}-${index}`}
                  x={outerRadius + 20}
                  y={cy - data.length * 10 + index * 20}
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                >
                  <circle cx={outerRadius + 10} cy={cy - data.length * 10 + index * 20 - 4} r={4} fill={entry.color || `url(#${gradientId})`} />
                  {entry.name}
                </text>
              ))}
            </g>
          )}
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
          className={cn(mainTextColorClass, mainFontWeightClass, "text-center font-mono")}
          style={{ fontSize: `${mainTextFontSize}px`, lineHeight: 1 }}
        >
          {displayedMainValue}
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
    </motion.div>
  );
};

export default SmartDonutChart;