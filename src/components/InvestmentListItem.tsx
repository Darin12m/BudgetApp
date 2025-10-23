"use client";

import React from 'react';
import { Investment } from '@/hooks/use-investment-data';
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils'; // Assuming formatCurrency is in utils.ts
import { Button } from '@/components/ui/button';

interface InvestmentListItemProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
}

const InvestmentListItem: React.FC<InvestmentListItemProps> = ({ investment, onEdit }) => {
  const invested = investment.quantity * investment.buyPrice;
  const currentValue = investment.quantity * investment.currentPrice;
  const gainLoss = currentValue - invested;
  const gainLossPercentage = invested === 0 ? 0 : (gainLoss / invested) * 100;

  const isPositive = gainLossPercentage >= 0;
  const gainLossColor = isPositive ? 'text-green-600' : 'text-red-600';
  const Icon = investment.type === 'Stock' ? DollarSign : Bitcoin;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors active:bg-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          investment.type === 'Stock' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{investment.name}</p>
          <p className="text-xs text-gray-500 truncate">{investment.type} • {formatCurrency(currentValue)}</p>
        </div>
      </div>
      <div className="text-right ml-2 flex-shrink-0">
        <p className={`font-semibold text-sm ${gainLossColor} flex items-center justify-end`}>
          {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {gainLossPercentage.toFixed(2)}%
        </p>
        <p className={`text-xs ${gainLossColor}`}>{formatCurrency(gainLoss)}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onEdit(investment)} className="ml-2 flex-shrink-0">
        <Edit className="h-4 w-4 text-gray-500" />
      </Button>
    </div>
  );
};

export default InvestmentListItem;