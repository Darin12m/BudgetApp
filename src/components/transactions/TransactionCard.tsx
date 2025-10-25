"use client";

import React, { memo } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction, Category } from '@/hooks/use-finance-data'; // Import types

interface TransactionCardProps {
  transaction: Transaction;
  categories: Category[];
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
  onEdit: (transaction: Transaction) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = memo(({ transaction, categories, formatCurrency, onEdit }) => {
  const category = categories.find(c => c.name === transaction.category);
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          transaction.amount > 0 ? 'bg-emerald/10 text-emerald' : 'bg-muted/50 text-foreground'
        }`}>
          <span className="text-lg">{transaction.amount > 0 ? '💰' : category?.emoji || '💳'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate">{transaction.merchant}</p>
          <p className="text-xs text-muted-foreground truncate">{category?.name || 'Uncategorized'}</p>
        </div>
      </div>
      <div className="text-right ml-2 flex-shrink-0 flex items-center space-x-2">
        <p className={`font-semibold text-sm ${transaction.amount > 0 ? 'text-emerald' : 'text-foreground'}`}>
          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
        </p>
        <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)} className="h-8 w-8 text-muted-foreground hover:bg-muted/50">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

export default TransactionCard;