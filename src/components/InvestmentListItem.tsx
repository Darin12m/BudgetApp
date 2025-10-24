"use client";

import React from 'react';
import { Investment } from '@/hooks/use-investment-data';
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface InvestmentListItemProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  priceChangeStatus: 'up' | 'down' | 'none'; // New prop for animation
}

const InvestmentListItem: React.FC<InvestmentListItemProps> = ({ investment, onEdit, priceChangeStatus }) => {
  const invested = investment.quantity * investment.buyPrice;
  const currentValue = investment.quantity * investment.currentPrice;
  const gainLoss = currentValue - invested;
  const gainLossPercentage = invested === 0 ? 0 : (gainLoss / invested) * 100;

  const isPositive = gainLossPercentage >= 0;
  const gainLossColor = isPositive ? 'text-arrowUp' : 'text-arrowDown'; // Changed to use new arrow colors
  const Icon = investment.type === 'Stock' ? DollarSign : Bitcoin;

  // Price change animation classes
  const priceChangeClasses = {
    up: 'animate-pulse-green', // Custom Tailwind animation
    down: 'animate-pulse-red', // Custom Tailwind animation
    none: '',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg shadow-sm border border-border/50 hover:bg-muted/50 transition-colors active:bg-muted animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          investment.type === 'Stock' ? 'bg-blue/10 text-blue' : 'bg-lilac/10 text-lilac' // Using new color variables
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{investment.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {investment.type} • {formatCurrency(currentValue)}
            <span className="ml-2 text-arrowUp text-xs font-medium flex items-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-arrowUp/40 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-arrowUp"></span>
              </span>
              <span className="ml-1">Live</span>
            </span>
          </p>
        </div>
      </div>
      <div className="text-right ml-2 flex-shrink-0">
        <div className={`flex items-center justify-end rounded-full px-2 py-1 ${isPositive ? 'bg-arrowUp/10' : 'bg-arrowDown/10'} ${priceChangeClasses[priceChangeStatus]} animate-float-up-down`}>
          {isPositive ? <TrendingUp className="w-3 h-3 mr-1 text-arrowUp" /> : <TrendingDown className="w-3 h-3 mr-1 text-arrowDown" />}
          <p className={`font-semibold text-sm ${gainLossColor}`}>
            {gainLossPercentage.toFixed(2)}%
          </p>
        </div>
        <p className={`text-xs ${gainLossColor} mt-1 ${priceChangeClasses[priceChangeStatus]}`}>{formatCurrency(gainLoss)}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onEdit(investment)} className="ml-2 flex-shrink-0 text-muted-foreground hover:bg-muted/50">
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default InvestmentListItem;