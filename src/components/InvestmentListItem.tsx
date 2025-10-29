"use client";

import React, { useMemo } from 'react';
import { Investment } from '@/hooks/use-investment-data';
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Edit, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface InvestmentListItemProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  priceChangeStatus: 'up' | 'down' | 'none';
  isAlerted: boolean;
}

const InvestmentListItem: React.FC<InvestmentListItemProps> = ({ investment, onEdit, priceChangeStatus, isAlerted }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency, selectedCurrency } = useCurrency();

  const invested = investment.quantity * investment.buyPrice;
  const currentValue = investment.quantity * investment.currentPrice;
  const gainLoss = currentValue - invested;
  const gainLossPercentage = invested === 0 ? 0 : (gainLoss / invested) * 100;

  const isPositiveOverall = gainLossPercentage >= 0;
  const overallGainLossColor = isPositiveOverall ? 'text-arrowUp' : 'text-arrowDown';
  const Icon = investment.type === 'Stock' ? DollarSign : Bitcoin;

  const change24hPercent = investment.change24hPercent;
  const isPositive24h = typeof change24hPercent === 'number' && change24hPercent >= 0;
  const change24hColor = isPositive24h ? 'text-arrowUp' : 'text-arrowDown';
  const Change24hIcon = isPositive24h ? TrendingUp : TrendingDown;

  const priceChangeClasses = {
    up: 'animate-pulse-green',
    down: 'animate-pulse-red',
    none: '',
  };

  return (
    <motion.div
      className={cn(
        "flex items-center justify-between p-4 glassmorphic-card hover:bg-muted/50 transition-colors active:bg-muted animate-in fade-in slide-in-from-bottom-2 duration-300",
        isAlerted && "border-destructive ring-2 ring-destructive/50 animate-pulse-red"
      )}
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-sm)" }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          investment.type === 'Stock' ? 'bg-blue/10 text-blue' : 'bg-lilac/10 text-lilac'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{investment.name}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-muted-foreground truncate cursor-help">
                {investment.type} • {formatCurrency(currentValue)}
                <span className="ml-2 text-arrowUp text-xs font-medium flex items-center">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-arrowUp/40 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-arrowUp"></span>
                  </span>
                  <span className="ml-1">{t("investments.live")}</span>
                </span>
              </p>
            </TooltipTrigger>
          </Tooltip>
        </div>
      </div>
      <div className="text-right ml-2 flex-shrink-0">
        {typeof change24hPercent === 'number' && (
          <div className={`flex items-center justify-end rounded-full px-2 py-1 ${isPositive24h ? 'bg-arrowUp/10' : 'bg-arrowDown/10'} ${priceChangeClasses[priceChangeStatus]} animate-float-up-down`}>
            {Change24hIcon && <Change24hIcon className={`w-3 h-3 mr-1 ${change24hColor}`} />}
            <p className={`font-semibold text-sm ${change24hColor} font-mono`}>
              {change24hPercent.toFixed(2)}%
            </p>
          </div>
        )}
        {isAlerted && (
          <p className="text-destructive text-xs mt-1 flex items-center justify-end">
            <AlertTriangle className="w-3 h-3 mr-1" /> {t("investments.alert")}
          </p>
        )}
        <p className={`text-xs ${overallGainLossColor} mt-1 ${priceChangeClasses[priceChangeStatus]} font-mono`}>{formatCurrency(gainLoss)}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        variant="ghost" size="icon" onClick={() => onEdit(investment)} className="ml-2 flex-shrink-0 text-muted-foreground hover:bg-muted/50">
        <Edit className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
};

export default InvestmentListItem;