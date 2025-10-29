"use client";

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, X } from 'lucide-react';
import { Investment } from '@/hooks/use-investment-data';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation

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
    <Card className="card-shadow border-none bg-gradient-to-br from-primary/10 to-blue/10 border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-500 backdrop-blur-lg">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Zap className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("microInvesting.leftThisWeek", { amount: <span className="text-emerald font-semibold">{formatCurrency(weeklyRemainingBudget)}</span> })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("microInvesting.considerInvesting", { amount: <span className="text-primary font-semibold">{formatCurrency(suggestedInvestmentAmount)}</span>, assetName: suggestedAsset.name })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            onClick={handleInvestClick}
            className="h-8 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-transform hover:scale-[1.02] active:scale-98"
          >
            {t("microInvesting.invest")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8 text-muted-foreground hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MicroInvestingSuggestionCard;