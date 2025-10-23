"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
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
    { name: 'Spent', value: totalSpent, color: '#3b82f6' }, // Blue
    { name: 'Remaining', value: remainingBudget > 0 ? remainingBudget : 0, color: '#10b981' }, // Green
  ];

  const isOverBudget = remainingBudget < 0;
  const summaryColor = isOverBudget ? 'text-red-500' : 'text-green-600';
  const summaryIcon = isOverBudget ? TrendingDown : TrendingUp;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-6 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-blue-100 mb-1">Your Monthly Budget</p>
          <p className="text-4xl font-bold">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="w-24 h-24 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={45}
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
              <Tooltip formatter={(value, name) => [`${formatCurrency(Number(value))}`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">
              {totalBudgeted > 0 ? `${Math.round(spentPercentage)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-blue-100">Spent</p>
          <p className="font-semibold">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-100">Remaining</p>
          <p className="font-semibold">{formatCurrency(remainingBudget)}</p>
        </div>
      </div>

      {rolloverEnabled && previousMonthLeftover > 0 && (
        <div className="bg-white/10 rounded-lg p-3 mb-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-100">Previous month rollover</span>
            <span className="font-semibold">+{formatCurrency(previousMonthLeftover)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm bg-white/10 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          {summaryIcon && <summaryIcon className={`w-4 h-4 ${summaryColor}`} />}
          <span className={`font-medium ${summaryColor}`}>{smartSummary}</span>
        </div>
        <span className="text-blue-100">{formatCurrency(remainingPerDay)}/day</span>
      </div>
    </div>
  );
};

export default RemainingBudgetCard;