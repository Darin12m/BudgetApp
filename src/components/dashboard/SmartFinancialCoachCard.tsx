"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

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
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency } = useCurrency();

  const spendingChangePercentage = useMemo(() => {
    if (previousWeekSpending === 0) {
      return currentWeekSpending > 0 ? 100 : 0;
    }
    return ((currentWeekSpending - previousWeekSpending) / previousWeekSpending) * 100;
  }, [currentWeekSpending, previousWeekSpending]);

  const spendingTrendText = useMemo(() => {
    if (spendingChangePercentage > 0) {
      return t("smartCoach.spentMore", { percentage: Math.abs(spendingChangePercentage).toFixed(0) });
    } else if (spendingChangePercentage < 0) {
      return t("smartCoach.spentLess", { percentage: Math.abs(spendingChangePercentage).toFixed(0) });
    }
    return t("smartCoach.spendingConsistent");
  }, [spendingChangePercentage, t]);

  const topCategoriesText = useMemo(() => {
    if (topSpendingCategories.length === 0) {
      return t("smartCoach.noSpendingCategories");
    }
    const categories = topSpendingCategories.map(cat => `${cat.name} (${formatCurrency(cat.amount)})`);
    return t("smartCoach.topCategories", { categories: categories.join(t("common.and")), isAre: categories.length > 1 ? t("common.are") : t("common.is"), categoryCount: categories.length > 1 ? t("common.categories") : t("common.category") });
  }, [topSpendingCategories, formatCurrency, t]);

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
      return t("smartCoach.noForecast");
    } else if (forecastedRemainingBalance >= 0) {
      return t("smartCoach.budgetWillLast", { amount: formatCurrency(forecastedRemainingBalance) });
    } else {
      const remainingBudgetBeforeForecast = totalBudgetedMonthly - totalExpensesThisMonth;
      if (remainingBudgetBeforeForecast <= 0) {
        return t("smartCoach.alreadyOverBudget", { amount: formatCurrency(Math.abs(remainingBudgetBeforeForecast)) });
      } else {
        const daysToRunOut = remainingBudgetBeforeForecast / dailyAvgSpending;
        const projectedRunOutDate = addDays(currentMonthDate, daysToRunOut);
        return t("smartCoach.runOutOfBudget", { date: format(projectedRunOutDate, 'MMMM dd') });
      }
    }
  }, [totalBudgetedMonthly, dailyAvgSpending, daysPassedThisMonth, forecastedRemainingBalance, totalExpensesThisMonth, currentMonthDate, formatCurrency, t]);

  return (
    <motion.div
      className="glassmorphic-card animate-in fade-in slide-in-from-bottom-2 duration-500"
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
        <CardTitle className="text-base sm:text-lg font-semibold tracking-tight flex items-center"> {/* Applied consistent typography */}
          <Lightbulb className="w-5 h-5 mr-2 text-primary" /> {t("smartCoach.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-5 lg:p-6 pt-0 text-sm sm:text-base text-foreground"> {/* Applied consistent padding and typography */}
        <p className="flex items-center break-words text-balance"> {/* Added text wrapping */}
          {spendingChangePercentage > 0 ? <TrendingUp className="w-4 h-4 mr-2 text-arrowDown flex-shrink-0" /> : <TrendingDown className="w-4 h-4 mr-2 text-arrowUp flex-shrink-0" />}
          <span className="min-w-0">{spendingTrendText}</span> {/* Added min-w-0 */}
        </p>
        <p className="flex items-center break-words text-balance"> {/* Added text wrapping */}
          <Zap className="w-4 h-4 mr-2 text-blue flex-shrink-0" />
          <span className="min-w-0">{topCategoriesText}</span> {/* Added min-w-0 */}
        </p>
        <p className="flex items-center break-words text-balance"> {/* Added text wrapping */}
          <Lightbulb className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
          <span className="min-w-0">{projectedBudgetStatus}</span> {/* Added min-w-0 */}
        </p>
        {forecastedRemainingBalance < 0 && totalBudgetedMonthly > 0 && (
          <p className="flex items-center text-destructive break-words text-balance"> {/* Added text wrapping */}
            <TrendingDown className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="min-w-0">{t("smartCoach.recommendReview")}</span> {/* Added min-w-0 */}
          </p>
        )}
        {forecastedRemainingBalance >= 0 && totalBudgetedMonthly > 0 && (
          <p className="flex items-center text-emerald break-words text-balance"> {/* Added text wrapping */}
            <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="min-w-0">{t("smartCoach.recommendKeepUp")}</span> {/* Added min-w-0 */}
          </p>
        )}
      </CardContent>
    </motion.div>
  );
};

export default SmartFinancialCoachCard;