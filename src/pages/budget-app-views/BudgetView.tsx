"use client";

import React, { useMemo } from 'react';
import { PiggyBank, Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category } from '@/hooks/use-finance-data';
import CategoryCard from '@/components/budget/CategoryCard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CustomProgress } from '@/components/common/CustomProgress';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';
import CircularProgressChart from '@/components/charts/CircularProgressChart'; // Import new chart
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency

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
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrencyToParts } = useCurrency(); // Destructure new function

  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = remainingBudget < 0;
  const isCloseToLimit = !isOverBudget && spentPercentage >= 80;

  const remainingBudgetTextColor = isOverBudget
    ? 'text-destructive'
    : isCloseToLimit
      ? 'text-amber-500'
      : 'text-emerald';

  const formattedTotalBudgeted = formatCurrencyToParts(totalBudgeted);
  const formattedTotalSpent = formatCurrencyToParts(totalSpent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6 pb-24 sm:pb-6"
    >
      <motion.div
        className="glassmorphic-card p-5 sm:p-6 text-foreground"
        whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="h2 font-bold tracking-tight">{t("budget.monthlyBudget")}</h2>
          {budgetSettings.rolloverEnabled && (
            <div className="flex items-center space-x-1 bg-muted/50 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
              <ArrowRight className="w-3 h-3" />
              <span>{t("budget.rolloverOn")}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex-1 text-center sm:text-left mb-6 sm:mb-0">
            <p className="caption mb-1">{t("dashboard.remainingBudget")}</p>
            {isOverBudget && (
              <Badge variant="destructive" className="mb-2 flex items-center justify-center mx-auto sm:mx-0 w-fit px-3 py-1 text-xs animate-pulse-red-glow">
                <AlertTriangle className="w-3 h-3 mr-1" /> {t("dashboard.overBudget")}
              </Badge>
            )}
            <p className={cn("font-bold font-mono tracking-tight", remainingBudgetTextColor)} style={{ fontSize: 'clamp(2.25rem, 8vw, 3.75rem)' }}>
              {formatCurrency(remainingBudget)}
            </p>
            <p className="p mt-1">
              {formatCurrency(remainingPerDay)} {t("dashboard.leftPerDay")} • {daysLeft} {t("dashboard.daysLeft")}
            </p>
          </div>

          <div className="w-40 h-40 relative flex-shrink-0 flex items-center justify-center">
            <CircularProgressChart
              value={Math.min(spentPercentage, 100)}
              label={t("dashboard.used")}
              size={120}
              strokeWidth={10}
              progressColor={isOverBudget ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
              isOverBudget={isOverBudget}
              textColorClass={cn("text-foreground", isOverBudget ? "text-destructive" : isCloseToLimit ? "text-amber-500" : "text-emerald")}
              fontWeightClass="font-bold"
              unit="%"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-end gap-x-4 gap-y-3 mb-4 border-t border-border pt-4">
          <div className="flex flex-col items-center text-center w-full sm:w-auto flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-0 sm:items-start sm:text-left">
            <p className="caption mb-1">{t("dashboard.totalBudgeted")}</p>
            <p className="h3 font-mono overflow-hidden text-ellipsis whitespace-nowrap flex items-baseline">
              <span className="mr-1">{formattedTotalBudgeted.symbol}</span>
              <span>{formattedTotalBudgeted.value}</span>
            </p>
          </div>
          <div className="flex flex-col items-center text-center w-full sm:w-auto flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-0 sm:items-start sm:text-left">
            <p className="caption mb-1">{t("dashboard.totalSpent")}</p>
            <p className="h3 font-mono overflow-hidden text-ellipsis whitespace-nowrap flex items-baseline">
              <span className="mr-1">{formattedTotalSpent.symbol}</span>
              <span>{formattedTotalSpent.value}</span>
            </p>
          </div>
        </div>
        {budgetSettings.rolloverEnabled && budgetSettings.previousMonthLeftover > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("dashboard.previousMonthRollover")}</span>
              <span className="font-semibold text-foreground font-mono">+{formatCurrency(budgetSettings.previousMonthLeftover)}</span>
            </div>
          </div>
        )}
        <CustomProgress value={Math.min(spentPercentage, 100)} className="h-2" indicatorColor="hsl(var(--primary))" />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-mono">{formatCurrency(remainingPerDay)}/{t("common.day")} • {daysLeft} {t("dashboard.daysLeft")}</span>
          <span className="font-medium text-foreground font-mono">{Math.round(spentPercentage)}% {t("dashboard.used")}</span>
        </div>
      </motion.div>

      <motion.div
        className="glassmorphic-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
        whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="h3 font-semibold text-foreground tracking-tight">{t("budget.budgetCategories")}</h3>
            <Button
              onClick={handleAddCategory}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl transition-colors text-sm active:bg-primary/80"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("budget.addCategory")}</span>
              <span className="sm:hidden">{t("common.add")}</span>
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
              <p className="h3 font-semibold text-foreground">{t("budget.noCategoriesSetup")}</p>
              <p className="p mt-2">{t("budget.addFirstCategoryDescription")}</p>
              <Button onClick={handleAddCategory} className="mt-4">
                {t("budget.addFirstCategory")}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BudgetView;