"use client";

import React, { useMemo, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { PiggyBank, Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category } from '@/hooks/use-finance-data';
import CategoryCard from '@/components/budget/CategoryCard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CustomProgress } from '@/components/common/CustomProgress';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import DynamicTextInCircle from '@/components/common/DynamicTextInCircle';
import DonutChartWithCentralText from '@/components/common/DonutChartWithCentralText'; // Import the new unified component

interface BudgetViewProps {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  remainingPerDay: number;
  daysLeft: number;
  budgetSettings: any;
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
  categories: Category[];
  handleAddCategory: () => void;
  handleEditCategory: (category: Category) => void;
  handleDeleteCategory: (id: string) => void;
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

const BudgetView: React.FC<BudgetViewProps> = ({
  totalBudgeted,
  totalSpent,
  remainingBudget,
  remainingPerDay,
  daysLeft,
  budgetSettings,
  formatCurrency,
  categories,
  handleAddCategory,
  handleEditCategory,
  handleDeleteCategory,
}) => {
  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = remainingBudget < 0;
  const isCloseToLimit = !isOverBudget && spentPercentage >= 80;

  // Visually cap the spent percentage at 100% for the chart ring
  const visualSpentPercentage = Math.min(spentPercentage, 100);
  const visualRemainingPercentage = Math.max(0, 100 - visualSpentPercentage); // Ensure non-negative

  const pieChartData = useMemo(() => [
    { name: 'Spent', value: visualSpentPercentage, color: 'url(#gradientPrimary-budget)' },
    { name: 'Remaining', value: visualRemainingPercentage, color: 'hsl(var(--emerald))' },
  ], [visualSpentPercentage, visualRemainingPercentage]);

  const remainingBudgetTextColor = isOverBudget
    ? 'text-destructive'
    : isCloseToLimit
      ? 'text-amber-500'
      : 'text-emerald';

  // Define donut radii
  const donutInnerRadius = 65;
  const donutOuterRadius = 75;

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
      {/* Overall Budget Summary Card */}
      <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 text-foreground card-shadow border border-border/50 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold">Monthly Budget</h2>
          {budgetSettings.rolloverEnabled && (
            <div className="flex items-center space-x-1 bg-muted/50 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
              <ArrowRight className="w-3 h-3" />
              <span>Rollover ON</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Budget Overview Text */}
          <div className="flex-1 text-center sm:text-left mb-6 sm:mb-0">
            <p className="text-sm text-muted-foreground mb-1">Remaining Budget</p>
            {isOverBudget && (
              <Badge variant="destructive" className="mb-2 flex items-center justify-center mx-auto sm:mx-0 w-fit px-3 py-1 text-xs animate-pulse-red-glow">
                <AlertTriangle className="w-3 h-3 mr-1" /> Over Budget
              </Badge>
            )}
            <p className={cn("font-bold", remainingBudgetTextColor)} style={{ fontSize: 'clamp(2.25rem, 8vw, 3.75rem)' }}>
              {formatCurrency(remainingBudget)}
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
              // Removed pieChartClassName={cn(isOverBudget && 'animate-pulse-red-glow')}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-end gap-x-4 gap-y-3 mb-4 border-t border-border pt-4">
          <div className="flex flex-col items-center text-center w-full sm:w-auto flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-0 sm:items-start sm:text-left">
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Total Budgeted</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold overflow-hidden text-ellipsis whitespace-nowrap">
              {formatCurrency(totalBudgeted)}
            </p>
          </div>
          <div className="flex flex-col items-center text-center w-full sm:w-auto flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-0 sm:items-start sm:text-left">
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Total Spent</p>
            <p className="text-xl sm:text-2xl font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>
        {budgetSettings.rolloverEnabled && budgetSettings.previousMonthLeftover > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Previous month rollover</span>
              <span className="font-semibold text-foreground">+{formatCurrency(budgetSettings.previousMonthLeftover)}</span>
            </div>
          </div>
        )}
        <CustomProgress value={Math.min(spentPercentage, 100)} className="h-2" indicatorColor="hsl(var(--primary))" />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{formatCurrency(remainingPerDay)}/day • {daysLeft} days left</span>
          <span className="font-medium text-foreground">{Math.round(spentPercentage)}% used</span>
        </div>
      </div>

      {/* Budget Categories List */}
      <div className="bg-card rounded-xl sm:rounded-2xl card-shadow overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Budget Categories</h3>
            <Button onClick={handleAddCategory} className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-primary dark:bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 dark:hover:bg-primary/90 transition-colors text-sm active:bg-primary/80">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onEdit={handleEditCategory} onDelete={handleDeleteCategory} formatCurrency={formatCurrency} />
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold">No categories set up yet!</p>
              <p className="text-sm mt-2">Start by adding your first budget category to track your spending.</p>
              <Button onClick={handleAddCategory} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                Add First Category
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetView;