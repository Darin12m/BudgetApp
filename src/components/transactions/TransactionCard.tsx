"use client";

import React, { memo } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction, Category } from '@/hooks/use-finance-data';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface TransactionCardProps {
  transaction: Transaction;
  categories: Category[];
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
  onEdit: (transaction: Transaction) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = memo(({ transaction, categories, formatCurrency, onEdit }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const category = categories.find(c => c.id === transaction.categoryId);
  return (
    <motion.div
      className="flex items-center justify-between py-3 px-4 sm:px-5 lg:px-6 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted" // Applied consistent padding
      whileHover={{ scale: 1.01, backgroundColor: "hsl(var(--muted)/20%)" }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          transaction.amount > 0 ? 'bg-emerald/10 text-emerald' : 'bg-muted/50 text-foreground'
        }`}>
          <span className="text-lg">{transaction.amount > 0 ? '💰' : category?.emoji || '💳'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate">{transaction.merchant}</p> {/* Applied consistent typography and truncate */}
          <p className="text-xs text-muted-foreground truncate">{category?.name || t("common.uncategorized")}</p> {/* Applied consistent typography and truncate */}
        </div>
      </div>
      <div className="text-right ml-2 flex-shrink-0 flex items-center space-x-2">
        <p className={`font-semibold text-sm font-mono ${transaction.amount > 0 ? 'text-emerald' : 'text-foreground'}`}> {/* Applied consistent typography */}
          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
        </p>
        <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)} className="h-8 w-8 text-muted-foreground">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
});

export default TransactionCard;