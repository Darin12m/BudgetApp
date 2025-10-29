"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface OverallPortfolioSummaryCardProps {
  currentValue: number;
  gainLossPercentage: number;
}

const OverallPortfolioSummaryCard: React.FC<OverallPortfolioSummaryCardProps> = ({
  currentValue,
  gainLossPercentage,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency } = useCurrency();
  const isPositive = gainLossPercentage >= 0;
  const gainLossColor = isPositive ? 'text-arrowUp' : 'text-arrowDown';
  const Icon: LucideIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      className="glassmorphic-card text-foreground"
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{t("investments.totalPortfolioValue")}</p>
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-4xl font-bold font-mono tracking-tight mb-1">{formatCurrency(currentValue)}</p>
        <div className="flex items-center space-x-2">
          {Icon && <Icon className={`w-4 h-4 ${gainLossColor}`} />}
          <span className={`text-sm ${gainLossColor} font-mono`}>
            {gainLossPercentage.toFixed(2)}% {t("dashboard.thisMonth")}
          </span>
        </div>
      </CardContent>
    </motion.div>
  );
};

export default OverallPortfolioSummaryCard;