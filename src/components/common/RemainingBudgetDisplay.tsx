"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface RemainingBudgetDisplayProps {
  remainingBudget: number;
  remainingPerDay: number;
  daysLeft: number;
  totalBudgeted: number; // Needed for percentage calculation
  totalSpent: number; // Needed for percentage calculation
}

const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }
    const elapsed = time - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const newCount = end * progress;

    setCount(newCount);

    if (progress < 1) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      setCount(end);
    }
  }, [end, duration]);

  useEffect(() => {
    startTimeRef.current = undefined;
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [end, animate]);

  return count;
};

const RemainingBudgetDisplay: React.FC<RemainingBudgetDisplayProps> = ({
  remainingBudget,
  remainingPerDay,
  daysLeft,
  totalBudgeted,
  totalSpent,
}) => {
  const { t } = useTranslation();
  const { formatCurrency, formatCurrencyToParts } = useCurrency();

  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = remainingBudget < 0;
  const isCloseToLimit = !isOverBudget && spentPercentage >= 80;

  const remainingBudgetTextColor = isOverBudget
    ? 'text-destructive'
    : isCloseToLimit
      ? 'text-amber-500'
      : 'text-emerald';

  const animatedRemainingBudget = useCountUp(remainingBudget, 1000);
  const formattedRemainingBudget = formatCurrencyToParts(animatedRemainingBudget);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-start leading-none" // Main container for alignment
    >
      <p className="text-sm font-semibold text-muted-foreground opacity-70 mb-1">
        {t("dashboard.remainingBudget")}
      </p>
      {isOverBudget && (
        <Badge variant="destructive" className="mb-2 flex items-center justify-center w-fit px-3 py-1 text-xs animate-pulse-red-glow">
          <AlertTriangle className="w-3 h-3 mr-1" /> {t("dashboard.overBudget")}
        </Badge>
      )}
      <p className={cn("text-[clamp(2.25rem,8vw,3.75rem)] font-bold font-mono tracking-tight flex items-baseline", remainingBudgetTextColor, "leading-none")}>
        <span className="mr-1">{formattedRemainingBudget.symbol}</span>
        <span>{formattedRemainingBudget.value}</span>
      </p>
      <p className="text-sm text-muted-foreground font-medium mt-1">
        {formatCurrency(remainingPerDay)} {t("dashboard.leftPerDay")} • {daysLeft} {t("dashboard.daysLeft")}
      </p>
    </motion.div>
  );
};

export default RemainingBudgetDisplay;