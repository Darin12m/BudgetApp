"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';

interface AllocationData {
  name: string;
  value: number;
  color: string;
}

interface EnhancedPortfolioAllocationChartProps {
  title: string;
  data: AllocationData[];
  emptyMessage: string;
  totalPortfolioValue: number;
}

// Custom Active Shape for hover effect
const CustomActiveShape: React.FC<any> = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value, formatCurrency } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-semibold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // More pronounced scale on hover
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-150 ease-out"
        style={{ filter: `drop-shadow(0 0 8px ${fill}80)` }} // Enhanced glow
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

// Custom Label for percentages
const CustomizedLabel: React.FC<any> = ({ cx, cy, midAngle, outerRadius, percent, index, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 0.65; // Position slightly further inside the slice
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--primary-foreground))" // White text for contrast
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom Legend component
const CustomLegend: React.FC<any> = ({ payload, totalValue, formatCurrency }) => {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-sm">
      {payload.map((entry: any, index: number) => {
        const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
        return (
          <div key={`item-${index}`} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-semibold text-foreground">{percentage.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
};


const EnhancedPortfolioAllocationChart: React.FC<EnhancedPortfolioAllocationChartProps> = ({ title, data, emptyMessage, totalPortfolioValue }) => {
  const { formatUSD } = useCurrency();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }));
  }, [data]);

  return (
    <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] flex flex-col items-center justify-center">
        {chartData.length > 0 ? (
          <div className="relative w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                  activeShape={<CustomActiveShape formatCurrency={formatUSD} />}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  labelLine={false}
                  label={CustomizedLabel}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#color-${index})`} stroke={entry.color} strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    backgroundColor: 'hsl(var(--tooltip-bg))',
                    border: '1px solid hsl(var(--tooltip-border-color))',
                    borderRadius: '8px',
                    color: 'hsl(var(--tooltip-text-color))'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    formatUSD(value),
                    `${props.payload.name} (${props.payload.percentage.toFixed(0)}%)`
                  ]}
                />
                <Legend
                  content={<CustomLegend totalValue={totalPortfolioValue} formatCurrency={formatUSD} />}
                  wrapperStyle={{ paddingTop: '16px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">
                  {totalPortfolioValue > 0 ? formatUSD(totalPortfolioValue) : '100%'}
                </p>
                <p className="text-xs text-muted-foreground">Allocated</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedPortfolioAllocationChart;