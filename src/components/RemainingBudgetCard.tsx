"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts'; // Added LineChart, Line
import { PiggyBank, TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const remainingPercentage = 100 - spentPercentage;

  const data = [
    { name: 'Spent', value: totalSpent, color: 'hsl(var(--primary))' }, // Use primary accent for spent
    { name: 'Remaining', value: remainingBudget > 0 ? remainingBudget : 0, color: 'hsl(var(--emerald))' }, // Use emerald for remaining
  ];

  const isOverBudget = remainingBudget < 0;
  const summaryColor = isOverBudget ? 'text-destructive' : 'text-emerald';
  const SummaryIcon: LucideIcon = isOverBudget ? TrendingDown : TrendingUp;

  // Placeholder data for sparkline chart
  const sparklineData = [
    { name: 'Day 1', value: 1000 },
    { name: 'Day 2', value: 950 },
    { name: 'Day 3', value: 800 },
    { name: 'Day 4', value: 750 },
    { name: 'Day 5', value: 600 },
    { name: 'Day 6', value: 550 },
    { name: 'Day 7', value: 400 },
  ];

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-6 card-shadow animate-in fade-in slide-in-from-top-2 duration-300 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Remaining Budget</p>
          <p className={`text-5xl font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>{formatCurrency(remainingBudget)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatCurrency(remainingPerDay)} left per day • {daysLeft} days left
          </p>
        </div>
        <div className="w-28 h-28 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={60}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                dataKey="value"
                isAnimationActive={true}
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${formatCurrency(Number(value))}`, name]} contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
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
            <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
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