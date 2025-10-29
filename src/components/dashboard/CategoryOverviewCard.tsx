"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { CustomProgress } from '@/components/common/CustomProgress';
import DonutWithCenterText from '@/components/DonutWithCenterText';
import { useTranslation } from 'react-i18next'; // Import useTranslation

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

  const donutData = useMemo(() => {
    const clampedSpentPercentage = Math.min(spentPercentage, 100);
    const remainingPercentage = 100 - clampedSpentPercentage;

    return [
      { name: t("dashboard.spent"), value: clampedSpentPercentage, color: 'hsl(var(--primary))' },
      { name: t("dashboard.remaining"), value: remainingPercentage, color: 'hsl(var(--muted)/50%)' },
    ];
  }, [spentPercentage, t]);

  return (
    <Card className="card-shadow border-none bg-card text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <PiggyBank className="w-5 h-5 mr-2 text-primary" /> {t("dashboard.budgetCategories")}
        </CardTitle>
        <Link to="/budget-app?view=budget" className="text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:bg-primary/90 font-medium flex items-center">
          {t("common.viewAll")}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div className="w-full sm:w-1/2 h-[150px] flex items-center justify-center mb-4 sm:mb-0 relative">
            {totalBudgetedMonthly > 0 ? (
              <DonutWithCenterText
                chartId="category-overview"
                mainValue={`${Math.round(spentPercentage)}%`}
                mainLabel={t("dashboard.spent")}
                data={donutData}
                innerRadius={40}
                outerRadius={60}
                formatValue={formatCurrency}
                isOverBudget={isOverBudget}
                startAngle={90}
                endAngle={-270}
                strokeWidth={2}
                strokeColor="hsl(var(--primary))"
                backgroundFill="hsl(var(--muted)/50%)"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">{t("dashboard.noBudgetYet")}</p>
              </div>
            )}
          </div>
          <div className="w-full sm:w-1/2 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t("dashboard.totalBudgeted")}</span>
              <span className="font-semibold text-foreground">{formatCurrency(totalBudgetedMonthly)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t("dashboard.totalSpent")}</span>
              <span className="font-semibold text-foreground">{formatCurrency(totalSpentMonthly)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t("dashboard.remaining")}</span>
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
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <h3 className="text-base font-semibold text-foreground mb-3">{t("dashboard.yourCategories")}</h3>
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
                        <span className="font-medium text-foreground text-sm">{cat.name}</span>
                      </div>
                      <div className="text-sm text-right flex items-center space-x-1">
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
              <p className="text-muted-foreground text-sm text-center">{t("dashboard.noCategoriesDefined")}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryOverviewCard;