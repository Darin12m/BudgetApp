"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector, LineChart, Line } from 'recharts';
import { PiggyBank, TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils'; // Import cn for conditional class merging

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
        style={{ filter: `drop-shadow(0 0 10px ${fill}80)` }} // Increased glow intensity
      />
    </g>
  );
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

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showPercentageLabel, setShowPercentageLabel] = useState(false);

  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = remainingBudget < 0;

  // Visually cap the spent percentage at 100% for the chart ring
  const visualSpentPercentage = Math.min(spentPercentage, 100);
  const visualRemainingPercentage = 100 - visualSpentPercentage;

  const pieChartData = [
    { name: 'Spent', value: visualSpentPercentage, color: 'url(#gradientPrimary)' },
    { name: 'Remaining', value: visualRemainingPercentage, color: 'hsl(var(--emerald))' },
  ];

  // Data for the subtle background ring (always 100%)
  const backgroundPieData = [{ name: 'Background', value: 100, color: 'hsl(var(--muted)/50%)' }];

  const summaryColor = isOverBudget ? 'text-arrowDown' : 'text-arrowUp';
  const SummaryIcon: LucideIcon = isOverBudget ? TrendingDown : TrendingUp;

  // Sparkline Chart Placeholder
  const sparklineData = [
    { name: 'Day 1', value: 1000 },
    { name: 'Day 2', value: 950 },
    { name: 'Day 3', value: 800 },
    { name: 'Day 4', value: 750 },
    { name: 'Day 5', value: 600 },
    { name: 'Day 6', value: 550 },
    { name: 'Day 7', value: 400 },
  ];

  // Animation for percentage label fade-in
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPercentageLabel(true);
    }, 800); // After ring animation duration
    return () => clearTimeout(timer);
  }, []);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const spentAmount = totalSpent;
      const budgetedAmount = totalBudgeted;
      const overBudgetAmount = isOverBudget ? Math.abs(remainingBudget) : 0;

      return (
        <div className="bg-tooltip-bg border border-tooltip-border-color rounded-lg p-3 text-sm text-tooltip-text-color shadow-lg">
          <p className="font-semibold mb-1">{data.name}</p>
          <p>Budgeted: <span className="font-medium">{formatCurrency(budgetedAmount)}</span></p>
          <p>Spent: <span className="font-medium">{formatCurrency(spentAmount)}</span></p>
          {isOverBudget && <p className="text-destructive">Over Budget: <span className="font-medium">{formatCurrency(overBudgetAmount)}</span></p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-6 card-shadow animate-in fade-in slide-in-from-top-2 duration-300 border border-border/50 backdrop-blur-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Remaining Budget</p>
          <p className={`text-5xl font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>{formatCurrency(remainingBudget)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatCurrency(remainingPerDay)} left per day • {daysLeft} days left
          </p>
        </div>
        {/* Increased container size for the chart to prevent clipping */}
        <div className="w-36 h-36 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart onMouseEnter={onPieEnter} onMouseLeave={onPieLeave}>
              <defs>
                <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--blue))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
              </defs>
              {/* Background Ring */}
              <Pie
                data={backgroundPieData}
                cx="50%"
                cy="50%"
                innerRadius={55} // Adjusted radius
                outerRadius={65} // Adjusted radius
                fill="hsl(var(--muted)/50%)"
                dataKey="value"
                isAnimationActive={false}
                stroke="none"
              />
              {/* Main Data Ring */}
              <Pie
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={activeIndex !== null ? CustomActiveShape : undefined}
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={55} // Adjusted radius
                outerRadius={65} // Adjusted radius
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                dataKey="value"
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
                stroke="none"
                className={cn(
                  isOverBudget && 'animate-pulse-red' // Apply pulsing glow if over budget
                )}
              >
                {pieChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }} // Soft glow
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            showPercentageLabel ? 'opacity-100' : 'opacity-0'
          )}>
            <span className="text-xl font-bold text-foreground">
              {totalBudgeted > 0 ? `${Math.round(spentPercentage)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline Chart Placeholder */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-foreground mb-2">Spending Trend</p>
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', color: 'hsl(var(--tooltip-text-color))' }} />
          </LineChart>
        </ResponsiveContainer>
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
          {SummaryIcon && <SummaryIcon className={`w-4 h-4 ${summaryColor}`} />}
          <span className={`font-medium ${summaryColor}`}>{smartSummary}</span>
        </div>
        <span className="text-muted-foreground">Total Spent: {formatCurrency(totalSpent)}</span>
      </div>
    </div>
  );
};

export default RemainingBudgetCard;