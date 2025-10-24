"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PiggyBank, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';

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

  const chartData = categories
    .filter(cat => cat.spent > 0) // Only show categories with spending
    .map(cat => ({
      name: cat.name,
      value: cat.spent,
      color: cat.color,
    }));

  const remainingBudget = totalBudgetedMonthly - totalSpentMonthly;
  const spentPercentage = totalBudgetedMonthly > 0 ? (totalSpentMonthly / totalBudgetedMonthly) * 100 : 0;

  const pieChartData = [
    { name: 'Spent', value: totalSpentMonthly, color: 'hsl(var(--primary))' },
    { name: 'Remaining', value: Math.max(0, remainingBudget), color: 'hsl(var(--emerald))' },
  ];

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
      <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 pt-0">
        <div className="w-full sm:w-1/2 h-[150px] flex items-center justify-center mb-4 sm:mb-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
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
        </div>
        <div className="w-full sm:w-1/2 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Budgeted</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalBudgetedMonthly)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Spent</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalSpentMonthly)}</span>
          </div>
          <div className="flex justify-between text-sm">
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
      </CardContent>
    </Card>
  );
};

export default CategoryOverviewCard;