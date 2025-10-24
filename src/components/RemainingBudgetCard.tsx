"use client";

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { TrendingUp, TrendingDown, Lightbulb, Zap, LucideIcon, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import AnimatedNumber from '@/components/common/AnimatedNumber'; // Import the new component
import { cn } from '@/lib/utils'; // Import cn for conditional class merging

interface RemainingBudgetCardProps {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  remainingPerDay: number;
  daysLeft: number;
  rolloverEnabled: boolean;
  previousMonthLeftover: number;
}

// Custom Active Shape for hover effect on Pie Chart
const CustomActiveShape: React.FC<any> = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4} // Slightly larger on hover
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-150 ease-out"
        style={{ filter: `drop-shadow(0 0 6px ${fill}80)` }} // Soft glow
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
}) => {
  const { formatCurrency } = useCurrency();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const visualSpentPercentage = Math.min(spentPercentage, 100); // Cap visual at 100%

  const pieChartData = useMemo(() => {
    const data = [];
    const spentValue = Math.min(totalSpent, totalBudgeted); // Cap spent value for visual representation
    const remainingValue = Math.max(0, totalBudgeted - spentValue);

    if (spentValue > 0) {
      data.push({ name: 'Spent', value: spentValue, color: 'hsl(var(--primary))' });
    }
    if (remainingValue > 0) {
      data.push({ name: 'Remaining', value: remainingValue, color: 'hsl(var(--emerald))' });
    }
    // If over budget, and not already represented by spentValue > totalBudgeted
    if (totalBudgeted > 0 && totalSpent > totalBudgeted) {
      data.push({ name: 'Overspent', value: totalSpent - totalBudgeted, color: 'hsl(var(--destructive))' });
    } else if (totalBudgeted === 0 && totalSpent > 0) {
      // If no budget but spent, show as spent
      data.push({ name: 'Spent', value: totalSpent, color: 'hsl(var(--primary))' });
    }

    return data.length > 0 ? data : [{ name: 'No Data', value: 1, color: 'hsl(var(--muted))' }];
  }, [totalBudgeted, totalSpent, remainingBudget]);

  const getBudgetStatus = useMemo(() => {
    let icon: LucideIcon = Lightbulb;
    let colorClass = 'text-muted-foreground';
    let message = "On track to stay under budget this month."; // Default message

    if (totalBudgeted === 0) {
      icon = Lightbulb;
      colorClass = 'text-muted-foreground';
      message = "Set up your budget to get insights!";
    } else if (remainingBudget < 0) {
      icon = TrendingDown;
      colorClass = 'text-destructive';
      message = `You are ${formatCurrency(Math.abs(remainingBudget))} over budget!`;
    } else if (spentPercentage >= 80) {
      icon = Zap;
      colorClass = 'text-amber-500';
      message = `You've spent ${Math.round(spentPercentage)}% of your budget. Be careful!`;
    } else if (remainingBudget > 0 && daysLeft > 0) {
      icon = TrendingUp;
      colorClass = 'text-emerald';
      message = `${formatCurrency(remainingBudget)} left for ${daysLeft} days. On track!`;
    }
    return { icon, colorClass, message };
  }, [totalBudgeted, totalSpent, remainingBudget, daysLeft, formatCurrency, spentPercentage]);

  const { icon: StatusIcon, colorClass: statusColorClass, message: statusMessage } = getBudgetStatus;

  return (
    <Card className="card-shadow border-none bg-card text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <StatusIcon className={`w-5 h-5 mr-2 ${statusColorClass}`} /> Monthly Budget
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 pt-0">
        <div className="w-full sm:w-1/2 h-[150px] relative flex items-center justify-center mb-4 sm:mb-0">
          {totalBudgeted > 0 || totalSpent > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart onMouseEnter={onPieEnter} onMouseLeave={onPieLeave}>
                <defs>
                  {pieChartData.map((entry, index) => (
                    <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={entry.color} stopOpacity={0.5}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={<CustomActiveShape />}
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                  labelLine={false}
                >
                  {pieChartData.map((entry, index) => (
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
                    formatCurrency(value),
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No budget data yet.</p>
            </div>
          )}
          {(totalBudgeted > 0 || totalSpent > 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-foreground">
                {`${Math.round(spentPercentage)}%`}
              </span>
            </div>
          )}
        </div>
        <div className="w-full sm:w-1/2 space-y-3 sm:pl-6">
          <p className={cn("text-sm font-medium", statusColorClass, totalBudgeted > 0 && totalSpent > totalBudgeted && "text-destructive flex items-center")}>
            {totalBudgeted > 0 && totalSpent > totalBudgeted && <AlertCircle className="w-4 h-4 mr-1 animate-pulse-red" />}
            {statusMessage}
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Budgeted</span>
            <span className="font-semibold text-foreground">
              <AnimatedNumber value={totalBudgeted} format={formatCurrency} />
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Spent</span>
            <span className="font-semibold text-foreground">
              <AnimatedNumber value={totalSpent} format={formatCurrency} />
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className={`font-semibold ${remainingBudget >= 0 ? 'text-emerald' : 'text-destructive'}`}>
              <AnimatedNumber value={remainingBudget} format={formatCurrency} />
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden mt-3">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          {daysLeft > 0 && remainingBudget > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              You can spend up to <span className="font-semibold">{formatCurrency(remainingPerDay)}</span> per day for the rest of the month.
            </p>
          )}
          {rolloverEnabled && previousMonthLeftover > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Includes <span className="font-semibold">{formatCurrency(previousMonthLeftover)}</span> rolled over from last month.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemainingBudgetCard;