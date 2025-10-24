"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency

interface OverallPortfolioSummaryCardProps {
  currentValue: number;
  gainLossPercentage: number;
}

const OverallPortfolioSummaryCard: React.FC<OverallPortfolioSummaryCardProps> = ({
  currentValue,
  gainLossPercentage,
}) => {
  const { formatUSD } = useCurrency(); // Use formatUSD from context
  const isPositive = gainLossPercentage >= 0;
  const gainLossColor = isPositive ? 'text-arrowUp' : 'text-arrowDown';
  const Icon: LucideIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="card-shadow border-none bg-card text-foreground border border-border/50 backdrop-blur-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-4xl font-bold mb-1">{formatUSD(currentValue)}</p>
        <div className="flex items-center space-x-2">
          {Icon && <Icon className={`w-4 h-4 ${gainLossColor}`} />}
          <span className={`text-sm ${gainLossColor}`}>
            {gainLossPercentage.toFixed(2)}% this month
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallPortfolioSummaryCard;