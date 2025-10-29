"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PiggyBank, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CustomProgress } from '@/components/common/CustomProgress';
import DonutWithCenterText from '@/components/DonutWithCenterText';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface RemainingBudgetCardProps {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  remainingPerDay: number;
  daysLeft: number;
  rolloverEnabled: boolean;
  previousMonthLeftover: number;
  smartSummary: string;
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

const RemainingBudgetCard: React.FC<RemainingBudgetCardProps> = ({
  totalBudgeted,
  totalSpent,
  remainingBudget,
  remainingPerDay,
  daysLeft,
  rolloverEnabled,
  previousMonthLeftover,
  smartSummary,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency } = useCurrency();

  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = remainingBudget < 0;
  const isCloseToLimit = !isOverBudget && spentPercentage >= 80;

  const remainingBudgetTextColor = isOverBudget
    ? 'text-destructive'
    : isCloseToLimit
      ? 'text-amber-500'
      : 'text-emerald';

  const animatedRemainingBudget = useCountUp(remainingBudget, 1000);

  const sparklineData = [
    { day: 1, value: 1000 },
    { day: 2, value: 950 },
    { day: 3, value: 800 },
    { day: 4, value: 750 },
    { day: 5, value: 600 },
    { day: 6, value: 550 },
    { day: 7, value: 400 },
  ];

  const donutData = useMemo(() => {
    const clampedSpentPercentage = Math.min(spentPercentage, 100);
    const remainingPercentage = 100 - clampedSpentPercentage;

    return [
      { name: t("dashboard.spent"), value: clampedSpentPercentage, color: 'hsl(var(--primary))' },
      { name: t("dashboard.remaining"), value: remainingPercentage, color: 'hsl(var(--muted)/50%)' },
    ];
  }, [spentPercentage, t]);

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-6 card-shadow animate-in fade-in slide-in-from-top-2 duration-300 border border-border/50 backdrop-blur-lg">
      <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-4">
        <div className="flex-1 text-center sm:text-left mb-6 sm:mb-0">
          <p className="text-sm text-muted-foreground mb-1">{t("dashboard.remainingBudget")}</p>
          {isOverBudget && (
            <Badge variant="destructive" className="mb-2 flex items-center justify-center mx-auto sm:mx-0 w-fit px-3 py-1 text-xs animate-pulse-red-glow">
              <AlertTriangle className="w-3 h-3 mr-1" /> {t("dashboard.overBudget")}
            </Badge>
          )}
          <p className={cn("font-bold", remainingBudgetTextColor)} style={{ fontSize: 'clamp(2.25rem, 8vw, 3.75rem)' }}>
            {formatCurrency(animatedRemainingBudget)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatCurrency(remainingPerDay)} {t("dashboard.leftPerDay")} • {daysLeft} {t("dashboard.daysLeft")}
          </p>
        </div>

        <div className="w-40 h-40 relative flex-shrink-0">
          <DonutWithCenterText
            chartId="budget-summary"
            mainValue={`${Math.round(spentPercentage)}%`}
            mainLabel={t("dashboard.used")}
            data={donutData}
            innerRadius={65}
            outerRadius={75}
            formatValue={formatCurrency}
            isOverBudget={isOverBudget}
            startAngle={90}
            endAngle={-270}
            strokeWidth={2}
            strokeColor="hsl(var(--primary))"
            backgroundFill="hsl(var(--muted)/50%)"
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-foreground mb-2">{t("dashboard.spendingTrend")}</p>
        <div className="h-[80px] w-full"> 
          <ResponsiveContainer width="100%" height="100%"> 
            <AreaChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="day" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', color: 'hsl(var(--tooltip-text-color))', pointerEvents: 'none' }}
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label: string) => `${t("common.day")} ${label}`}
              />
              <Area type="monotone" dataKey="value" stroke="url(#colorTrend)" fill="url(#colorTrendFill)" strokeWidth={2} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {rolloverEnabled && previousMonthLeftover > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 mt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("dashboard.previousMonthRollover")}</span>
              <span className="font-semibold text-foreground">+{formatCurrency(previousMonthLeftover)}</span>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3 mt-4">
        <div className="flex items-center space-x-2">
          <PiggyBank className={`w-4 h-4 ${remainingBudgetTextColor}`} />
          <span className={`font-medium ${remainingBudgetTextColor}`}>{smartSummary}</span>
        </div>
        <span className="text-muted-foreground">{t("dashboard.totalSpentColon")} {formatCurrency(totalSpent)}</span>
      </div>
    </div>
  );
};

export default RemainingBudgetCard;