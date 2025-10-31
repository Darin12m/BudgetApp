"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PiggyBank, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CustomProgress } from '@/components/common/CustomProgress';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';
import CircularProgressChart from '@/components/charts/CircularProgressChart'; // Import new chart
import RemainingBudgetDisplay from '@/components/common/RemainingBudgetDisplay'; // Import new component
import { Card, CardContent } from '@/components/ui/card'; // Import Card

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
  const { formatCurrency, formatCurrencyToParts } = useCurrency();

  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = remainingBudget < 0;
  const isCloseToLimit = !isOverBudget && spentPercentage >= 80;

  const remainingBudgetTextColor = isOverBudget
    ? 'text-destructive'
    : isCloseToLimit
      ? 'text-amber-500'
      : 'text-emerald';

  const sparklineData = [
    { day: 1, value: 1000 },
    { day: 2, value: 950 },
    { day: 3, value: 800 },
    { day: 4, value: 750 },
    { day: 5, value: 600 },
    { day: 6, value: 550 },
    { day: 7, value: 400 },
  ];

  return (
    <Card className="glassmorphic-card p-4 sm:p-5 lg:p-6 animate-in fade-in slide-in-from-top-2 duration-300"> {/* Applied consistent card style and padding */}
      <motion.div
        whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-4">
          <div className="flex-1 mb-6 sm:mb-0">
            <RemainingBudgetDisplay
              remainingBudget={remainingBudget}
              remainingPerDay={remainingPerDay}
              daysLeft={daysLeft}
              totalBudgeted={totalBudgeted}
              totalSpent={totalSpent}
            />
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

        <div className="mt-6">
          <p className="text-base sm:text-lg font-semibold tracking-tight mb-2">{t("dashboard.spendingTrend")}</p> {/* Applied consistent typography */}
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
          <div className="bg-muted/50 rounded-lg p-3 mt-4 text-sm sm:text-base"> {/* Applied consistent typography */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("dashboard.previousMonthRollover")}</span>
                <span className="font-semibold text-foreground">+{formatCurrency(previousMonthLeftover)}</span>
              </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm sm:text-base bg-muted/50 rounded-lg p-3 mt-4"> {/* Applied consistent typography */}
          <div className="flex items-center space-x-2 min-w-0"> {/* Added min-w-0 */}
            <PiggyBank className={`w-4 h-4 flex-shrink-0 ${remainingBudgetTextColor}`} />
            <span className={`font-medium ${remainingBudgetTextColor} break-words text-balance`}>{smartSummary}</span> {/* Added text wrapping */}
          </div>
          <span className="text-muted-foreground flex-shrink-0">{t("dashboard.totalSpentColon")} {formatCurrency(totalSpent)}</span>
        </div>
      </motion.div>
    </Card>
  );
};

export default RemainingBudgetCard;