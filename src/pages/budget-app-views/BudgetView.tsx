"use client";

import React, { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PiggyBank, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category } from '@/hooks/use-finance-data'; // Import Category type
import CategoryCard from '@/components/budget/CategoryCard'; // Import CategoryCard

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

const BudgetView: React.FC<BudgetViewProps> = memo(({
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
}) => (
  <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
    <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 text-foreground card-shadow border border-border/50 backdrop-blur-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl sm:text-2xl font-bold">October Budget</h2>
        {budgetSettings.rolloverEnabled && (
          <div className="flex items-center space-x-1 bg-muted/50 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
            <ArrowRight className="w-3 h-3" />
            <span>Rollover ON</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-between items-end gap-x-4 gap-y-3 mb-4">
        <div className="flex flex-col items-center text-center w-full sm:w-auto flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-0 sm:items-start sm:text-left">
          <p className="text-muted-foreground text-xs sm:text-sm mb-1">Budget</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold overflow-hidden text-ellipsis whitespace-nowrap">
            {formatCurrency(totalBudgeted)}
          </p>
        </div>
        <div className="flex flex-col items-center text-center w-full sm:w-auto flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-0 sm:items-start sm:text-left">
          <p className="text-muted-foreground text-xs sm:text-sm mb-1">Spent</p>
          <p className="text-xl sm:text-2xl font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="flex flex-col items-center text-center w-full sm:w-auto flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-0 sm:items-start sm:text-left">
          <p className="text-muted-foreground text-xs sm:text-sm mb-1">Left</p>
          <p className="text-xl sm:text-2xl font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
            {formatCurrency(remainingBudget)}
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
      <div className="bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-500"
          style={{ width: `${(totalSpent / totalBudgeted) * 100}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{formatCurrency(remainingPerDay)}/day • {daysLeft} days left</span>
        <span className="font-medium text-foreground">{Math.round((totalSpent / totalBudgeted) * 100)}% used</span>
      </div>
    </div>

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
));

export default BudgetView;