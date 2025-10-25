"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PiggyBank, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { CustomProgress } from '@/components/common/CustomProgress'; // Import CustomProgress
import DynamicTextInCircle from '@/components/common/DynamicTextInCircle'; // Import DynamicTextInCircle

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
  const { formatCurrency } = useCurrency();

  // Data for the overall budget pie chart
  const remainingBudget = totalBudgetedMonthly - totalSpentMonthly;
  const spentPercentage = totalBudgetedMonthly > 0 ? (totalSpentMonthly / totalBudgetedMonthly) * 100 : 0;

  const pieChartData = [
    { name: 'Spent', value: totalSpentMonthly, color: 'hsl(var(--primary))' },
    { name: 'Remaining', value: Math.max(0, remainingBudget), color: 'hsl(var(--emerald))' },
  ];

  // Define donut radii for DynamicTextInCircle
  const donutInnerRadius = 40;
  const donutOuterRadius = 60;
  const textContainerDiameter = donutInnerRadius * 2;

  return (
    <Card className="card-shadow border-none bg-card text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <PiggyBank className="w-5 h-5 mr-2 text-primary" /> Budget Categories
        </CardTitle>
        <Link to="/budget-app?view=budget" className="text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:bg-primary/90 font-medium flex items-center">
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div className="w-full sm:w-1/2 h-[150px] flex items-center justify-center mb-4 sm:mb-0 relative">
            {pieChartData.some(d => d.value > 0) ? ( // Only show chart if there's data
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={donutInnerRadius}
                    outerRadius={donutOuterRadius}
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
                <p className="text-sm">No spending data yet.</p>
              </div>
            )}
            {pieChartData.some(d => d.value > 0) && (
              <DynamicTextInCircle
                mainText={`${Math.round(spentPercentage)}%`}
                subText="Spent"
                containerSize={textContainerDiameter}
                maxFontSizePx={24}
                minFontSizePx={10}
                mainTextColorClass="text-white" // Force white text
                subTextColorClass="text-white" // Force white text
              />
            )}
          </div>
          <div className="w-full sm:w-1/2 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Budgeted</span>
              <span className="font-semibold text-foreground">{formatCurrency(totalBudgetedMonthly)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Spent</span>
              <span className="font-semibold text-foreground">{formatCurrency(totalSpentMonthly)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
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
          </div>
        </div>

        {/* List of Categories */}
        <div className="mt-4 border-t border-border pt-4">
          <h3 className="text-base font-semibold text-foreground mb-3">Your Categories</h3>
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
              <p className="text-muted-foreground text-sm text-center">No categories defined yet. Go to the Budget tab to add some!</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryOverviewCard;