"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OverallPortfolioSummaryCardProps {
  currentValue: number;
  gainLossPercentage: number;
}

const OverallPortfolioSummaryCard: React.FC<OverallPortfolioSummaryCardProps> = ({
  currentValue,
  gainLossPercentage,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency, formatCurrencyToParts } = useCurrency();
  const isPositive = gainLossPercentage >= 0;
  const gainLossColor = isPositive ? 'text-arrowUp' : 'text-arrowDown';
  const Icon: LucideIcon = isPositive ? TrendingUp : TrendingDown;

  const formattedCurrentValue = formatCurrencyToParts(currentValue);

  return (
    <Card className="glassmorphic-card text-foreground"> {/* Applied consistent card style */}
      <motion.div
        whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <CardContent className="p-4 sm:p-5 lg:p-6"> {/* Applied consistent padding */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-muted-foreground">{t("investments.totalPortfolioValue")}</p> {/* Applied consistent typography */}
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className={cn("text-[clamp(2.25rem,8vw,3.75rem)] font-bold font-mono tracking-tight flex items-baseline leading-none", formattedCurrentValue.value.length > 10 ? 'text-xl sm:text-2xl' : '')}> {/* Applied clamped text size and conditional smaller size for long numbers */}
            <span className="mr-1">{formattedCurrentValue.symbol}</span>
            <span>{formattedCurrentValue.value}</span>
          </p>
          <div className="flex items-center space-x-2">
            {Icon && <Icon className={`w-4 h-4 ${gainLossColor}`} />}
            <span className={`text-sm sm:text-base ${gainLossColor} font-mono`}> {/* Applied consistent typography */}
              {gainLossPercentage.toFixed(2)}% {t("dashboard.thisMonth")}
            </span>
          </div>
        </CardContent>
      </motion.div>
    </Card>
  );
};

export default OverallPortfolioSummaryCard;