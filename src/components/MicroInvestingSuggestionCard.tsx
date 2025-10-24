"use client";

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, X } from 'lucide-react';
import { Investment } from '@/hooks/use-investment-data';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency

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
  const { formatCurrency, formatUSD } = useCurrency(); // Use formatCurrency and formatUSD from context

  const shouldSuggest = useMemo(() => {
    if (!microInvestingEnabled || weeklyBudgetTarget <= 0) return false;
    // Suggest if remaining budget is more than 25% of the weekly target
    return weeklyRemainingBudget > (0.25 * weeklyBudgetTarget);
  }, [microInvestingEnabled, weeklyRemainingBudget, weeklyBudgetTarget]);

  const suggestedInvestmentAmount = useMemo(() => {
    if (!shouldSuggest) return 0;
    return weeklyRemainingBudget * (microInvestingPercentage / 100);
  }, [shouldSuggest, weeklyRemainingBudget, microInvestingPercentage]);

  const suggestedAsset = useMemo(() => {
    if (existingInvestments.length === 0) {
      return { name: "a new asset", type: "Choose asset" };
    }
    // Suggest a random existing stock or crypto
    const randomIndex = Math.floor(Math.random() * existingInvestments.length);
    const asset = existingInvestments[randomIndex];
    return {
      name: asset.name,
      type: asset.type,
      symbol: asset.symbol,
      coingeckoId: asset.coingeckoId,
    };
  }, [existingInvestments]);

  const handleInvestClick = useCallback(() => {
    if (suggestedInvestmentAmount > 0) {
      onInvest(
        suggestedInvestmentAmount,
        suggestedAsset.name,
        suggestedAsset.type as 'Stock' | 'Crypto', // Cast to correct type
        suggestedAsset.symbol,
        suggestedAsset.coingeckoId
      );
      toast.success(`Invested ${formatUSD(suggestedInvestmentAmount)} into ${suggestedAsset.name}!`); // Use formatUSD
      onDismiss(); // Dismiss after investing
    }
  }, [suggestedInvestmentAmount, suggestedAsset, onInvest, onDismiss, formatUSD]); // Use formatUSD

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
              You have <span className="text-emerald font-semibold">{formatCurrency(weeklyRemainingBudget)}</span> left this week.
            </p>
            <p className="text-sm text-muted-foreground">
              Consider investing <span className="text-primary font-semibold">{formatUSD(suggestedInvestmentAmount)}</span> into {suggestedAsset.name}. {/* Use formatUSD */}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            onClick={handleInvestClick}
            className="h-8 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-transform hover:scale-[1.02] active:scale-98"
          >
            Invest
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