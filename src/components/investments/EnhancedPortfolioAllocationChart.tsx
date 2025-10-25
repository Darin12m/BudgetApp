"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import DynamicTextInCircle from '@/components/common/DynamicTextInCircle'; // Import the new component

interface AllocationData {
  name: string;
  value: number;
  color?: string; // Color will be assigned internally
}

interface EnhancedPortfolioAllocationChartProps {
  title: string;
  data: AllocationData[];
  emptyMessage: string;
  totalPortfolioValue: number;
}

// Define a new, high-contrast color palette for the chart
const CHART_PALETTE = [
  'hsl(var(--primary))',     // Electric Cyan
  'hsl(var(--emerald))',     // Green
  'hsl(var(--lilac))',       // Lilac
  'hsl(25 95% 53%)',         // A vibrant orange
  'hsl(220 70% 50%)',        // A distinct blue
  'hsl(340 80% 60%)',        // A strong pink/magenta
  'hsl(175 70% 40%)',        // A deep teal
  'hsl(60 90% 50%)',         // A bright yellow
  'hsl(280 50% 70%)',        // A softer purple
  'hsl(10 80% 60%)',         // A warm red-orange
];

// Custom Active Shape for hover effect
const CustomActiveShape: React.FC<any> = (props) => {
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

interface AllocationLegendListProps {
  chartData: (AllocationData & { percentage: number; color: string })[];
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  formatCurrency: (value: number) => string; // Changed to formatCurrency
  totalPortfolioValue: number;
}

const AllocationLegendList: React.FC<AllocationLegendListProps> = ({
  chartData,
  activeIndex,
  setActiveIndex,
  formatCurrency,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full sm:w-1/2 max-h-[200px] overflow-y-auto pr-2">
      {chartData.map((entry, index) => (
        <div
          key={`legend-item-${index}`}
          className={cn(
            "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
            activeIndex === index ? "bg-muted/50" : "hover:bg-muted/20"
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-foreground truncate">{entry.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{entry.percentage.toFixed(0)}%</span>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(entry.value)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};


const EnhancedPortfolioAllocationChart: React.FC<EnhancedPortfolioAllocationChartProps> = ({ title, data, emptyMessage, totalPortfolioValue }) => {
  const { formatCurrency } = useCurrency(); // Changed to formatCurrency
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      color: CHART_PALETTE[index % CHART_PALETTE.length], // Assign color from new palette
    }));
  }, [data]);

  const activeItem = activeIndex !== null ? chartData[activeIndex] : null;

  // Define donut radii
  const donutInnerRadius = 60;
  const donutOuterRadius = 90;
  // Calculate the effective diameter for the text container based on inner radius
  const textContainerDiameter = donutInnerRadius * 2; 

  return (
    <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] flex flex-col sm:flex-row items-center justify-center p-4 sm:p-6">
        {chartData.length > 0 ? (
          <div className="relative w-full sm:w-1/2 h-full flex items-center justify-center mb-4 sm:mb-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}> {/* Added margin */}
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={entry.color} stopOpacity={0.5}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={<CustomActiveShape />}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={donutInnerRadius}
                  outerRadius={donutOuterRadius}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#color-${index})`} stroke={entry.color} strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  offset={10} {/* Added offset */}
                  contentStyle={{
                    fontSize: '12px',
                    backgroundColor: 'hsl(var(--tooltip-bg))',
                    border: '1px solid hsl(var(--tooltip-border-color))',
                    borderRadius: '8px',
                    color: 'hsl(var(--tooltip-text-color))',
                    pointerEvents: 'none', // Ensure tooltip doesn't block interaction with center label
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    formatCurrency(value), // Changed to formatCurrency
                    `${props.payload.name} (${props.payload.percentage.toFixed(0)}%)`
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label using DynamicTextInCircle */}
            <DynamicTextInCircle
              mainText={activeItem ? formatCurrency(activeItem.value) : formatCurrency(totalPortfolioValue)}
              subText={activeItem ? `${activeItem.name} (${activeItem.percentage.toFixed(0)}%)` : 'Total Allocated'}
              containerSize={textContainerDiameter} // Pass inner hole diameter
              maxFontSizePx={28} 
              minFontSizePx={10}
            />
          </div>
        ) : (
          <p className="text-muted-foreground w-full text-center">{emptyMessage}</p>
        )}
        {chartData.length > 0 && (
          <AllocationLegendList
            chartData={chartData}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            formatCurrency={formatCurrency} // Changed to formatCurrency
            totalPortfolioValue={totalPortfolioValue}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedPortfolioAllocationChart;