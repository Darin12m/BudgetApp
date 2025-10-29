"use client";

import React, { memo, useMemo } from 'react';
import { Calendar, List, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, Category } from '@/hooks/use-finance-data';
import TransactionCard from '@/components/transactions/TransactionCard';
import { isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  transactionSearchTerm: string;
  setTransactionSearchTerm: (term: string) => void;
  transactionFilterPeriod: 'all' | 'thisMonth';
  setTransactionFilterPeriod: (period: 'all' | 'thisMonth') => void;
  setIsAddEditTransactionModalOpen: (isOpen: boolean) => void;
  handleEditTransaction: (transaction: Transaction) => void;
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const TransactionsView: React.FC<TransactionsViewProps> = memo(({
  transactions,
  categories,
  transactionSearchTerm,
  setTransactionSearchTerm,
  transactionFilterPeriod,
  setTransactionFilterPeriod,
  setIsAddEditTransactionModalOpen,
  handleEditTransaction,
  formatCurrency,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const filteredTransactions = useMemo(() => {
    const lowerCaseSearchTerm = transactionSearchTerm.toLowerCase();
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    return transactions.filter(txn => {
      const category = categories.find(c => c.id === txn.categoryId);
      const categoryName = category ? category.name.toLowerCase() : 'uncategorized';

      const matchesSearch = txn.merchant.toLowerCase().includes(lowerCaseSearchTerm) ||
                            categoryName.includes(lowerCaseSearchTerm);

      const transactionDate = parseISO(txn.date);
      const matchesPeriod = transactionFilterPeriod === 'all' || isWithinInterval(transactionDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });

      return matchesSearch && matchesPeriod;
    }).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [transactions, transactionSearchTerm, transactionFilterPeriod, categories]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6 pb-24 sm:pb-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{t("transactions.title")}</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddEditTransactionModalOpen(true)}
          className="flex items-center space-x-2 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t("transactions.addTransaction")}</span>
          <span className="sm:hidden">{t("common.add")}</span>
        </motion.button>
      </div>

      <div className="sticky top-[64px] sm:top-[72px] glassmorphic-card z-10 py-2 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b rounded-none">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("transactions.searchTransactions")}
              className="w-full pl-9 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
              value={transactionSearchTerm}
              onChange={(e) => setTransactionSearchTerm(e.target.value)}
            />
          </div>
          <Select value={transactionFilterPeriod} onValueChange={(value: 'all' | 'thisMonth') => setTransactionFilterPeriod(value)}>
            <SelectTrigger className="w-full sm:w-[150px] bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t("transactions.filterPeriod")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("transactions.allTime")}</SelectItem>
              <SelectItem value="thisMonth">{t("transactions.thisMonth")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div
        className="glassmorphic-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
        whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="divide-y divide-border">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(txn => (
              <TransactionCard
                key={txn.id}
                transaction={txn}
                categories={categories}
                formatCurrency={formatCurrency}
                onEdit={handleEditTransaction}
              />
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <List className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">{t("transactions.noTransactionsFound")}</p>
              <p className="text-sm mt-2">{t("transactions.noTransactionsFoundDescription")}</p>
              <Button onClick={() => setIsAddEditTransactionModalOpen(true)} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                {t("transactions.addFirstTransaction")}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

export default TransactionsView;