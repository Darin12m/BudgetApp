"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PiggyBank, TrendingUp, TrendingDown, LucideIcon, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Import Badge component
import { PieSectorDataItem } from 'recharts/types/polar/Pie'; // Import PieSectorDataItem
import { CustomProgress } from '@/components/common/CustomProgress'; // Import CustomProgress
import DynamicTextInCircle from '@/components/common/DynamicTextInCircle'; // Import the new component
import DonutChartWithCentralText from '@/components/common/DonutChartWithCentralText'; // Import the new unified component

interface RemainingBudgetCardProps {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  remainingPerDay: number;
  daysLeft: number;
  rolloverEnabled: boolean;
  previousMonthLeftover: number;
  smartSummary: string;
}

// Custom Active Shape for hover effect on Donut Chart
const CustomActiveShape: React.FC<PieSectorDataItem> = (props) => {
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

// Custom Tooltip Content for Donut Chart
const CustomDonutTooltip = ({ active, payload, totalBudgeted, totalSpent, remainingBudget, isOverBudget, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-tooltip-bg border border-tooltip-border-color rounded-lg p-3 text-sm text-tooltip-text-color shadow-lg">
        <p className="font-semibold mb-1">Budget Overview</p>
        <p>Budgeted: <span className="font-medium">{formatCurrency(totalBudgeted)}</span></p>
        <p>Spent: <span className="font-medium">{formatCurrency(totalSpent)}</span></p>
        {isOverBudget ? (
          <p className="text-destructive">Over Budget: <span className="font-medium">{formatCurrency(Math.abs(remainingBudget))}</span></p>
        ) : (
          <p className="text-emerald">Remaining: <span className="font-medium">{formatCurrency(remainingBudget)}</span></p>
        )}
      </div>
    );
  }
  return null;
};

// Custom Hook for Number Counting Animation
const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(); // To track animation start time

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
      setCount(end); // Ensure it lands exactly on the end value
    }
  }, [end, duration]); // Dependencies are just end and duration

  useEffect(() => {
    startTimeRef.current = undefined; // Reset start time
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [end, animate]); // Dependencies are end and animate

  return count;
};


const RemainingBudgetCard: React.FC<RemainingBudgetCardProps> = ({
  totalBudgeted,
  totalSpent,
  remainingBudget,
  remainingPerDay,
  daysLeft,
  rolloverEnabled,
  previousMonthLeftover,
  smartSummary,
}) => {
  const { formatCurrency } = useCurrency();

  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = remainingBudget < 0;
  const isCloseToLimit = !isOverBudget && spentPercentage >= 80;

  // Visually cap the spent percentage at 100% for the chart ring
  const visualSpentPercentage = Math.min(spentPercentage, 100);
  const visualRemainingPercentage = Math.max(0, 100 - visualSpentPercentage); // Ensure non-negative

  const pieChartData = [
    { name: 'Spent', value: visualSpentPercentage, color: 'url(#gradientPrimary-budget)' },
    { name: 'Remaining', value: visualRemainingPercentage, color: 'hsl(var(--emerald))' },
  ];

  // Determine color for remaining budget text
  const remainingBudgetTextColor = isOverBudget
    ? 'text-destructive'
    : isCloseToLimit
      ? 'text-amber-500'
      : 'text-emerald';

  // Animate the remaining budget number
  const animatedRemainingBudget = useCountUp(remainingBudget, 1000);

  // Sparkline Chart Data (using placeholder for now, can be replaced with real data)
  const sparklineData = [
    { day: 1, value: 1000 },
    { day: 2, value: 950 },
    { day: 3, value: 800 },
    { day: 4, value: 750 },
    { day: 5, value: 600 },
    { day: 6, value: 550 },
    { day: 7, value: 400 },
  ];

  // Define donut radii
  const donutInnerRadius = 65;
  const donutOuterRadius = 75;

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-6 card-shadow animate-in fade-in slide-in-from-top-2 duration-300 border border-border/50 backdrop-blur-lg">
      <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-4">
        <div className="flex-1 text-center sm:text-left mb-6 sm:mb-0">
          <p className="text-sm text-muted-foreground mb-1">Remaining Budget</p>
          {isOverBudget && (
            <Badge variant="destructive" className="mb-2 flex items-center justify-center mx-auto sm:mx-0 w-fit px-3 py-1 text-xs animate-pulse-red-glow">
              <AlertTriangle className="w-3 h-3 mr-1" /> Over Budget
            </Badge>
          )}
          <p className={cn("font-bold", remainingBudgetTextColor)} style={{ fontSize: 'clamp(2.25rem, 8vw, 3.75rem)' }}>
            {formatCurrency(animatedRemainingBudget)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatCurrency(remainingPerDay)} left per day • {daysLeft} days left
          </p>
        </div>

        {/* Donut Chart */}
        <div className="w-40 h-40 relative flex-shrink-0">
          <DonutChartWithCentralText
            data={pieChartData}
            mainText={totalBudgeted > 0 ? `${Math.round(spentPercentage)}%` : '0%'}
            subText="Used"
            innerRadius={donutInnerRadius}
            outerRadius={donutOuterRadius}
            chartId="budget"
            formatValue={formatCurrency}
            tooltipContent={CustomDonutTooltip}
            activeShape={CustomActiveShape}
            totalBudgeted={totalBudgeted}
            totalSpent={totalSpent}
            remainingBudget={remainingBudget}
            isOverBudget={isOverBudget}
            spentPercentage={spentPercentage}
            pieChartClassName={cn(isOverBudget && 'animate-pulse-red-glow')}
          />
        </div>
      </div>

      {/* Spending Trend Line Graph */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-foreground mb-2">Spending Trend</p>
        {/* Fix: ResponsiveContainer must be the only child of its parent div */}
        <div className="h-[80px] w-full"> 
          <ResponsiveContainer width="100%" height="100%"> 
            <AreaChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="day" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', color: 'hsl(var(--tooltip-text-color))', pointerEvents: 'none' }}
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label: string) => `Day ${label}`}
              />
              <Area type="monotone" dataKey="value" stroke="url(#colorTrend)" fill="url(#colorTrendFill)" strokeWidth={2} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {rolloverEnabled && previousMonthLeftover > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 mt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Previous month rollover</span>
              <span className="font-semibold text-foreground">+{formatCurrency(previousMonthLeftover)}</span>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3 mt-4">
        <div className="flex items-center space-x-2">
          <PiggyBank className={`w-4 h-4 ${remainingBudgetTextColor}`} />
          <span className={`font-medium ${remainingBudgetTextColor}`}>{smartSummary}</span>
        </div>
        <span className="text-muted-foreground">Total Spent: {formatCurrency(totalSpent)}</span>
      </div>
    </div>
  );
};

export default RemainingBudgetCard;