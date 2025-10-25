"use client";

import React, { memo, useMemo } from 'react';
import { Calendar, List, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, Category } from '@/hooks/use-finance-data';
import TransactionCard from '@/components/transactions/TransactionCard';
import { isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  transactionSearchTerm: string;
  setTransactionSearchTerm: (term: string) => void;
  transactionFilterPeriod: 'all' | 'thisMonth';
  setTransactionFilterPeriod: (period: 'all' | 'thisMonth') => void;
  setIsAddEditTransactionModalOpen: (isOpen: boolean) => void; // Changed from setIsQuickAddModalOpen
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
  setIsAddEditTransactionModalOpen, // Changed prop name
  handleEditTransaction,
  formatCurrency,
}) => {
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
    }).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()); // Sort by date descending
  }, [transactions, transactionSearchTerm, transactionFilterPeriod, categories]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Transactions</h2>
        <Button onClick={() => setIsAddEditTransactionModalOpen(true)} className="flex items-center space-x-2 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="sticky top-[64px] sm:top-[72px] bg-card z-10 py-2 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-border card-shadow backdrop-blur-lg">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="w-full pl-9 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
              value={transactionSearchTerm}
              onChange={(e) => setTransactionSearchTerm(e.target.value)}
            />
          </div>
          <Select value={transactionFilterPeriod} onValueChange={(value: 'all' | 'thisMonth') => setTransactionFilterPeriod(value)}>
            <SelectTrigger className="w-full sm:w-[150px] bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl sm:rounded-2xl card-shadow overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
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
              <p className="text-lg font-semibold text-foreground">No transactions found.</p>
              <p className="text-sm mt-2">It looks like you haven't added any transactions yet. Use the "Add Transaction" button to get started!</p>
              <Button onClick={() => setIsAddEditTransactionModalOpen(true)} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                Add First Transaction
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TransactionsView;