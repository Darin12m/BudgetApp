"use client";

import React, { memo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Category } from '@/hooks/use-finance-data';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface HealthStatus {
  status: 'over' | 'warning' | 'good';
  color: string;
  bg: string;
}

const getHealthStatus = (spent: number, budgeted: number): HealthStatus => {
  const percentage = (spent / budgeted) * 100;
  if (percentage >= 100) return { status: 'over', color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-900/20' };
  if (percentage >= 80) return { status: 'warning', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' };
  return { status: 'good', color: 'text-emerald', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
};

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const CategoryCard: React.FC<CategoryCardProps> = memo(({ category, onEdit, onDelete, formatCurrency }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const percentage = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
  const health = getHealthStatus(category.spent, category.budgeted);

  return (
    <motion.div
      className="p-4 sm:p-6 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted"
      whileHover={{ scale: 1.01, backgroundColor: "hsl(var(--muted)/20%)" }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{category.emoji}</span>
          <div className="flex-1 min-w-0">
            <h4 className="h4 font-semibold text-foreground truncate tracking-tight">{category.name}</h4>
            <p className="p text-muted-foreground font-mono">
              {formatCurrency(category.spent)} {t("common.of")} {formatCurrency(category.budgeted)}
            </p>
          </div>
        </div>
        <div className="text-right ml-2 flex-shrink-0 flex items-center space-x-2">
          <p className={`font-semibold p ${health.color} font-mono`}>
            {formatCurrency(category.budgeted - category.spent)}
          </p>
          <p className="p text-muted-foreground font-mono">{Math.round(percentage)}%</p>
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-8 w-8 text-muted-foreground">
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glassmorphic-card">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("common.areYouSure")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("budget.categoryDeleteConfirmation", { categoryName: category.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(category.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="relative">
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: category.color
            }}
          />
        </div>
      </div>
    </motion.div>
  );
});

export default CategoryCard;