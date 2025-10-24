"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface SmartFinancialCoachCardProps {
  currentWeekSpending: number;
  previousWeekSpending: number;
  topSpendingCategories: { name: string; amount: number }[];
  totalBudgetedMonthly: number;
  totalSpentMonthly: number;
  currentMonthTransactions: { date: string; amount: number }[];
}

const SmartFinancialCoachCard: React.FC<SmartFinancialCoachCardProps> = ({
  currentWeekSpending,
  previousWeekSpending,
  topSpendingCategories,
  totalBudgetedMonthly,
  totalSpentMonthly,
  currentMonthTransactions,
}) => {
  const spendingChangePercentage = useMemo(() => {
    if (previousWeekSpending === 0) {
      return currentWeekSpending > 0 ? 100 : 0; // If previous was 0, any spending is 100% increase
    }
    return ((currentWeekSpending - previousWeekSpending) / previousWeekSpending) * 100;
  }, [currentWeekSpending, previousWeekSpending]);

  const spendingTrendText = useMemo(() => {
    if (spendingChangePercentage > 0) {
      return `You spent ${Math.abs(spendingChangePercentage).toFixed(0)}% more than last week 📈`;
    } else if (spendingChangePercentage < 0) {
      return `You spent ${Math.abs(spendingChangePercentage).toFixed(0)}% less than last week 👏`;
    }
    return "Your spending is consistent with last week.";
  }, [spendingChangePercentage]);

  const topCategoriesText = useMemo(() => {
    if (topSpendingCategories.length === 0) {
      return "No significant spending categories yet.";
    }
    const categories = topSpendingCategories.map(cat => `${cat.name} (${formatCurrency(cat.amount)})`);
    return `${categories.join(' and ')} ${categories.length > 1 ? 'are' : 'is'} your top ${categories.length > 1 ? 'categories' : 'category'}.`;
  }, [topSpendingCategories]);

  // --- Smart Forecast Calculations (re-used from BudgetApp) ---
  const currentMonthDate = useMemo(() => new Date(), []);
  const daysPassedThisMonth = currentMonthDate.getDate();
  const totalDaysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();

  const totalExpensesThisMonth = useMemo(() => {
    return currentMonthTransactions
      .filter(txn => txn.amount < 0)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  }, [currentMonthTransactions]);

  const dailyAvgSpending = daysPassedThisMonth > 0 ? totalExpensesThisMonth / daysPassedThisMonth : 0;
  const forecastedTotalSpending = dailyAvgSpending * totalDaysInMonth;
  const forecastedRemainingBalance = totalBudgetedMonthly - forecastedTotalSpending;

  const projectedBudgetStatus = useMemo(() => {
    if (totalBudgetedMonthly === 0 || dailyAvgSpending === 0 || daysPassedThisMonth === 0) {
      return "No spending forecast available yet. Add some transactions and set a budget!";
    } else if (forecastedRemainingBalance >= 0) {
      return `At your current pace, your budget will last until the end of the month with ${formatCurrency(forecastedRemainingBalance)} left.`;
    } else {
      const remainingBudgetBeforeForecast = totalBudgetedMonthly - totalExpensesThisMonth;
      if (remainingBudgetBeforeForecast <= 0) {
        return `You are already ${formatCurrency(Math.abs(remainingBudgetBeforeForecast))} over budget this month.`;
      } else {
        const daysToRunOut = remainingBudgetBeforeForecast / dailyAvgSpending;
        const projectedRunOutDate = addDays(currentMonthDate, daysToRunOut);
        return `At your current pace, you’ll run out of budget on ${format(projectedRunOutDate, 'MMMM dd')}.`;
      }
    }
  }, [totalBudgetedMonthly, dailyAvgSpending, daysPassedThisMonth, forecastedRemainingBalance, totalExpensesThisMonth, currentMonthDate]);
  // --- End Smart Forecast Calculations ---

  return (
    <Card className="card-shadow border-none bg-card border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-500 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-primary" /> Smart Financial Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        <p className="flex items-center">
          {spendingChangePercentage > 0 ? <TrendingUp className="w-4 h-4 mr-2 text-arrowDown" /> : <TrendingDown className="w-4 h-4 mr-2 text-arrowUp" />}
          {spendingTrendText}
        </p>
        <p className="flex items-center">
          <Zap className="w-4 h-4 mr-2 text-blue" /> {/* Changed from lilac to blue for consistency */}
          {topCategoriesText}
        </p>
        <p className="flex items-center">
          <Lightbulb className="w-4 h-4 mr-2 text-primary" /> {/* Changed from blue to primary for consistency */}
          {projectedBudgetStatus}
        </p>
        {/* Add a short recommendation line based on insights */}
        {forecastedRemainingBalance < 0 && totalBudgetedMonthly > 0 && (
          <p className="flex items-center text-destructive">
            <TrendingDown className="w-4 h-4 mr-2" />
            Recommendation: Review your top spending categories to cut back.
          </p>
        )}
        {forecastedRemainingBalance >= 0 && totalBudgetedMonthly > 0 && (
          <p className="flex items-center text-emerald">
            <TrendingUp className="w-4 h-4 mr-2" />
            Recommendation: Keep up the great work! Consider increasing your savings goals.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartFinancialCoachCard;