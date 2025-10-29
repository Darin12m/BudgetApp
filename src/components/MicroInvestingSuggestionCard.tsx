"use client";

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, X } from 'lucide-react';
import { Investment } from '@/hooks/use-investment-data';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface MicroInvestingSuggestionCardProps {
  weeklyRemainingBudget: number;
  weeklyBudgetTarget: number;
  microInvestingPercentage: number;
  microInvestingEnabled: boolean;
  existingInvestments: Investment[];
  onInvest: (amount: number, assetName: string, assetType: 'Stock' | 'Crypto', symbol?: string, coingeckoId?: string) => void;
  onDismiss: () => void;
}

const MicroInvestingSuggestionCard: React.FC<MicroInvestingSuggestionCardProps> = ({
  weeklyRemainingBudget,
  weeklyBudgetTarget,
  microInvestingPercentage,
  microInvestingEnabled,
  existingInvestments,
  onInvest,
  onDismiss,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency, formatUSD } = useCurrency();

  const shouldSuggest = useMemo(() => {
    if (!microInvestingEnabled || weeklyBudgetTarget <= 0) return false;
    return weeklyRemainingBudget > (0.25 * weeklyBudgetTarget);
  }, [microInvestingEnabled, weeklyRemainingBudget, weeklyBudgetTarget]);

  const suggestedInvestmentAmount = useMemo(() => {
    if (!shouldSuggest) return 0;
    return weeklyRemainingBudget * (microInvestingPercentage / 100);
  }, [shouldSuggest, weeklyRemainingBudget, microInvestingPercentage]);

  const suggestedAsset = useMemo(() => {
    if (existingInvestments.length === 0) {
      return { name: t("microInvesting.aNewAsset"), type: t("microInvesting.chooseAsset") };
    }
    const randomIndex = Math.floor(Math.random() * existingInvestments.length);
    const asset = existingInvestments[randomIndex];
    return {
      name: asset.name,
      type: asset.type,
      symbol: asset.symbol,
      coingeckoId: asset.coingeckoId,
    };
  }, [existingInvestments, t]);

  const handleInvestClick = useCallback(() => {
    if (suggestedInvestmentAmount > 0) {
      onInvest(
        suggestedInvestmentAmount,
        suggestedAsset.name,
        suggestedAsset.type as 'Stock' | 'Crypto',
        suggestedAsset.symbol,
        suggestedAsset.coingeckoId
      );
      toast.success(t("microInvesting.investedSuccess", { amount: formatCurrency(suggestedInvestmentAmount), assetName: suggestedAsset.name }));
      onDismiss();
    }
  }, [suggestedInvestmentAmount, suggestedAsset, onInvest, onDismiss, formatCurrency, t]);

  if (!shouldSuggest || suggestedInvestmentAmount <= 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glassmorphic-card border-none bg-gradient-to-br from-primary/10 to-blue/10 animate-in fade-in slide-in-from-bottom-2 duration-500"
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <Zap className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <p className="p font-medium text-foreground">
              {t("microInvesting.leftThisWeek", { amount: <span className="text-emerald font-semibold font-mono">{formatCurrency(weeklyRemainingBudget)}</span> })}
            </p>
            <p className="caption text-muted-foreground">
              {t("microInvesting.considerInvesting", { amount: <span className="text-primary font-semibold font-mono">{formatCurrency(suggestedInvestmentAmount)}</span>, assetName: suggestedAsset.name })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInvestClick}
            className="h-8 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-transform"
          >
            {t("microInvesting.invest")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8 text-muted-foreground hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </CardContent>
    </motion.div>
  );
};

export default MicroInvestingSuggestionCard;