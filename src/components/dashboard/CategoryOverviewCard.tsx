"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { CustomProgress } from '@/components/common/CustomProgress';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';
import CircularProgressChart from '@/components/charts/CircularProgressChart'; // Import new chart

interface Category {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
  emoji: string;
}

interface CategoryOverviewCardProps {
  categories: Category[];
  totalBudgetedMonthly: number;
  totalSpentMonthly: number;
}

const CategoryOverviewCard: React.FC<CategoryOverviewCardProps> = ({
  categories,
  totalBudgetedMonthly,
  totalSpentMonthly,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency } = useCurrency();

  const remainingBudget = totalBudgetedMonthly - totalSpentMonthly;
  const spentPercentage = totalBudgetedMonthly > 0 ? (totalSpentMonthly / totalBudgetedMonthly) * 100 : 0;
  const isOverBudget = remainingBudget < 0;

  return (
    <motion.div
      className="glassmorphic-card text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="h3 flex items-center tracking-tight">
          <PiggyBank className="w-5 h-5 mr-2 text-primary" /> {t("dashboard.budgetCategories")}
        </CardTitle>
        <Link to="/budget-app?view=budget" className="p text-primary dark:text-primary hover:text-primary/90 dark:hover:bg-primary/90 font-medium flex items-center">
          {t("common.viewAll")}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div className="w-full sm:w-1/2 h-[150px] flex items-center justify-center mb-4 sm:mb-0 relative">
            {totalBudgetedMonthly > 0 ? (
              <CircularProgressChart
                value={Math.min(spentPercentage, 100)}
                label={t("dashboard.spent")}
                size={120}
                strokeWidth={10}
                progressColor={isOverBudget ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                isOverBudget={isOverBudget}
                textColorClass={cn("text-foreground", isOverBudget ? "text-destructive" : "text-emerald")}
                fontWeightClass="font-bold"
                unit="%"
              />
            ) : (
              <p className="p text-center text-muted-foreground">{t("dashboard.noBudgetYet")}</p>
            )}
          </div>
          <div className="w-full sm:w-1/2 space-y-2">
            <div className="flex justify-between items-center p">
              <span className="text-muted-foreground">{t("dashboard.totalBudgeted")}</span>
              <span className="font-semibold text-foreground font-mono">{formatCurrency(totalBudgetedMonthly)}</span>
            </div>
            <div className="flex justify-between items-center p">
              <span className="text-muted-foreground">{t("dashboard.totalSpent")}</span>
              <span className="font-semibold text-foreground font-mono">{formatCurrency(totalSpentMonthly)}</span>
            </div>
            <div className="flex justify-between items-center p">
              <span className="text-muted-foreground">{t("dashboard.remaining")}</span>
              <span className={cn("font-semibold font-mono", remainingBudget >= 0 ? 'text-emerald' : 'text-destructive')}>
                {formatCurrency(remainingBudget)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden mt-3">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <h3 className="h4 font-semibold text-foreground mb-3 tracking-tight">{t("dashboard.yourCategories")}</h3>
          <div className="space-y-3">
            {categories.length > 0 ? (
              categories.map((cat) => {
                const categorySpentPercentage = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0;
                const isCategoryOverBudget = cat.spent > cat.budgeted;

                return (
                  <div key={cat.id} className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="font-medium text-foreground p">{cat.name}</span>
                      </div>
                      <div className="p text-right flex items-center space-x-1 font-mono">
                        <span className={cn("font-semibold", isCategoryOverBudget ? "text-destructive" : "text-foreground")}>
                          {formatCurrency(cat.spent)}
                        </span>
                        <span className="text-muted-foreground"> / {formatCurrency(cat.budgeted)}</span>
                      </div>
                    </div>
                    <CustomProgress value={Math.min(categorySpentPercentage, 100)} className="h-2" indicatorColor={cat.color} />
                  </div>
                );
              })
            ) : (
              <p className="p text-muted-foreground text-center">{t("dashboard.noCategoriesDefined")}</p>
            )}
          </div>
        </div>
      </CardContent>
    </motion.div>
  );
};

export default CategoryOverviewCard;