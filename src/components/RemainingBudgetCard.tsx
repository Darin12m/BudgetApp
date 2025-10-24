"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Lightbulb, Zap, LucideIcon } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

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

  const pieChartData = useMemo(() => {
    const data = [];
    if (totalSpent > 0) {
      data.push({ name: 'Spent', value: totalSpent, color: 'hsl(var(--primary))' });
    }
    if (remainingBudget > 0) {
      data.push({ name: 'Remaining', value: remainingBudget, color: 'hsl(var(--emerald))' });
    } else if (totalBudgeted > 0 && totalSpent > 0) {
      // If over budget, show the overspent amount as part of 'spent'
      data.push({ name: 'Overspent', value: Math.abs(remainingBudget), color: 'hsl(var(--destructive))' });
    }
    return data.length > 0 ? data : [{ name: 'No Data', value: 1, color: 'hsl(var(--muted))' }];
  }, [totalBudgeted, totalSpent, remainingBudget]);

  const getBudgetStatus = useMemo(() => {
    let icon: LucideIcon = Lightbulb;
    let colorClass = 'text-muted-foreground';
    let message = smartSummary;

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
    } else {
      icon = Lightbulb;
      colorClass = 'text-muted-foreground';
      message = "On track to stay under budget this month.";
    }
    return { icon, colorClass, message };
  }, [totalBudgeted, totalSpent, remainingBudget, daysLeft, smartSummary, formatCurrency, spentPercentage]);

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
          {totalBudgeted > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  isAnimationActive={true}
                  animationDuration={500}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${formatCurrency(Number(value))}`, name]} contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', color: 'hsl(var(--tooltip-text-color))' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No budget data yet.</p>
            </div>
          )}
          {totalBudgeted > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-foreground">
                {`${Math.round(spentPercentage)}%`}
              </span>
            </div>
          )}
        </div>
        <div className="w-full sm:w-1/2 space-y-2">
          <p className={`text-sm font-medium ${statusColorClass}`}>{statusMessage}</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Budgeted</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalBudgeted)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Spent</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className={`font-semibold ${remainingBudget >= 0 ? 'text-emerald' : 'text-destructive'}`}>
              {formatCurrency(remainingBudget)}
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
              You can spend up to {formatCurrency(remainingPerDay)} per day for the rest of the month.
            </p>
          )}
          {rolloverEnabled && previousMonthLeftover > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Includes {formatCurrency(previousMonthLeftover)} rolled over from last month.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemainingBudgetCard;