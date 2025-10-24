"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, TrendingUp, TrendingDown, DollarSign, Wallet, List, LucideIcon, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFinanceData } from '@/hooks/use-finance-data';
import { useInvestmentData, Investment } from '@/hooks/use-investment-data';
import { calculateGainLoss, getStartOfCurrentWeek, getEndOfCurrentWeek } from '@/lib/utils';
import RemainingBudgetCard from '@/components/RemainingBudgetCard';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import AddInvestmentModal from '@/components/AddInvestmentModal';
import BottomNavBar from '@/components/BottomNavBar';
import MicroInvestingSuggestionCard from '@/components/MicroInvestingSuggestionCard';
import SmartFinancialCoachCard from '@/components/SmartFinancialCoachCard';
import Sidebar from '@/components/layout/Sidebar';
import { format } from 'date-fns';
import { useCurrency } from '@/context/CurrencyContext';
import { useDateRange } from '@/context/DateRangeContext';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import EnhancedPortfolioAllocationChart from '@/components/investments/EnhancedPortfolioAllocationChart';
import CategoryOverviewCard from '@/components/dashboard/CategoryOverviewCard'; // Import the new component

interface IndexPageProps {
  userUid: string | null;
}

const ALLOCATION_COLORS = ['hsl(var(--blue))', 'hsl(var(--emerald))', 'hsl(var(--lilac))', '#f59e0b', '#ef4444', '#06b6d4'];

const Index: React.FC<IndexPageProps> = ({ userUid }) => {
  const { formatCurrency, formatUSD } = useCurrency();
  const { selectedRange } = useDateRange();

  const {
    transactions,
    categories,
    budgetSettings,
    addDocument,
    loading: financeLoading,
    error: financeError,
    currentWeekSpending,
    previousWeekSpending,
    totalBudgetedMonthly,
    totalSpentMonthly,
    remainingBudgetMonthly,
    weeklyBudgetTarget,
    topSpendingCategories,
    currentMonthTransactions,
  } = useFinanceData(userUid, selectedRange.from, selectedRange.to);

  const {
    investments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    priceChange,
    loading: investmentsLoading,
    error: investmentsError,
  } = useInvestmentData(userUid, selectedRange.from, selectedRange.to);

  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isAddInvestmentModalOpen, setIsAddInvestmentModalOpen] = useState(false);
  const [showMicroInvestingSuggestion, setShowMicroInvestingSuggestion] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  // --- Derived Budget Values ---
  const totalBudgeted = totalBudgetedMonthly;
  const totalSpent = totalSpentMonthly;
  const remainingBudget = remainingBudgetMonthly;

  const today = new Date();
  const endOfCurrentMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = Math.ceil((endOfCurrentMonthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const remainingPerDay = useMemo(() =>
    remainingBudget / daysLeft,
    [remainingBudget, daysLeft]
  );

  // --- Overall Investment Portfolio Summary ---
  const overallPortfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let currentValue = 0;
    let totalGainLoss = 0;

    investments.forEach(inv => {
      const invested = inv.quantity * inv.buyPrice;
      const current = inv.quantity * inv.currentPrice;
      totalInvested += invested;
      currentValue += current;
      totalGainLoss += (current - invested);
    });

    const totalGainLossPercentage = totalInvested === 0 ? 0 : (totalGainLoss / totalInvested) * 100;

    return {
      totalInvested,
      currentValue,
      totalGainLoss,
      totalGainLossPercentage,
    };
  }, [investments]);

  // --- Top 3 Performing Assets ---
  const topPerformers = useMemo(() => {
    return investments
      .map(inv => ({
        ...inv,
        ...calculateGainLoss(inv),
      }))
      .sort((a, b) => b.gainLossPercentage - a.gainLossPercentage)
      .slice(0, 3);
  }, [investments]);

  // --- Overall Allocation Data for Chart ---
  const overallAllocationData = useMemo(() => {
    const stockValue = investments
      .filter(inv => inv.type === 'Stock')
      .reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const cryptoValue = investments
      .filter(inv => inv.type === 'Crypto')
      .reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);

    const data = [];
    if (stockValue > 0) data.push({ name: 'Stocks', value: stockValue, color: ALLOCATION_COLORS[0] });
    if (cryptoValue > 0) data.push({ name: 'Crypto', value: cryptoValue, color: ALLOCATION_COLORS[1] });
    return data;
  }, [investments]);

  // --- Handlers ---
  const handleQuickAddTransaction = useCallback(async (amount: number, note: string, date: string, categoryName: string, isRecurring: boolean, frequency?: 'Monthly' | 'Weekly' | 'Yearly', nextDate?: string) => {
    if (!userUid) {
      toast.error("You must be logged in to save data.");
      return;
    }

    const transactionPayload = {
      date: date,
      merchant: note || 'Quick Add',
      amount: amount,
      category: categoryName,
      status: 'pending',
      account: transactions.length > 0 ? transactions[0].account : 'Default Account',
    };

    try {
      await addDocument('transactions', transactionPayload);
      toast.success("Transaction added successfully!");

      if (isRecurring && frequency && nextDate) {
        const categoryEmoji = categories.find(cat => cat.name === categoryName)?.emoji || '💳';
        await addDocument('recurringTransactions', {
          name: note || 'Quick Add',
          amount: amount,
          category: categoryName,
          frequency,
          nextDate,
          emoji: categoryEmoji,
        });
        toast.success("Recurring transaction also added!");
      }
    } catch (e: any) {
      console.error("Error adding transaction:", e.code, e.message);
      toast.error(`Failed to add transaction: ${e.message}`);
    }
  }, [addDocument, transactions, userUid, categories]);

  const handleSaveNewInvestment = useCallback(async (newInvestment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => {
    await addInvestment(newInvestment);
  }, [addInvestment]);

  const handleDeleteInvestment = useCallback(async (id: string) => {
    await deleteInvestment(id);
  }, [deleteInvestment]);

  const handleEditInvestment = useCallback(async (id: string, updatedData: Partial<Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>>) => {
    await updateInvestment(id, updatedData);
  }, [updateInvestment]);

  const handleMicroInvest = useCallback(async (amount: number, assetName: string, assetType: 'Stock' | 'Crypto', symbol?: string, coingeckoId?: string) => {
    const currentPrice = investments.find(inv => inv.name === assetName)?.currentPrice || 1;
    const quantity = amount / currentPrice;

    await addInvestment({
      name: assetName,
      type: assetType,
      quantity: quantity,
      buyPrice: currentPrice,
      currentPrice: currentPrice,
      datePurchased: format(new Date(), 'yyyy-MM-dd'),
      symbol: symbol,
      coingeckoId: coingeckoId,
    });
  }, [addInvestment, investments]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleViewChange = useCallback((view: string) => {
    if (view === 'dashboard') navigate('/');
    else if (view === 'investments') navigate('/investments');
    else if (view === 'settings') navigate('/settings');
    else navigate(`/budget-app?view=${view}`);
  }, [navigate]);

  const isLoading = financeLoading || investmentsLoading;
  const hasError = financeError || investmentsError;

  const portfolioGainLossColor = overallPortfolioSummary.totalGainLossPercentage >= 0 ? 'text-arrowUp' : 'text-arrowDown';
  const PortfolioGainLossIcon: LucideIcon = overallPortfolioSummary.totalGainLossPercentage >= 0 ? TrendingUp : TrendingDown;

  const currentWeekStart = format(getStartOfCurrentWeek(), 'MMM dd');
  const currentWeekEnd = format(getEndOfCurrentWeek(), 'MMM dd');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} onViewChange={handleViewChange} userUid={userUid} />

      <div className={`flex flex-col flex-1 min-w-0 ${sidebarOpen ? 'sm:ml-72' : 'sm:ml-0'} transition-all duration-300 ease-in-out`}>
        <header className="bg-card backdrop-blur-lg border-b border-border sticky top-0 z-40 safe-top card-shadow transition-colors duration-300">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={handleSidebarToggle}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted flex-shrink-0"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground capitalize truncate">Dashboard</h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Welcome back! Here's your financial overview.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <DateRangePicker />
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-lilac rounded-full flex items-center justify-center text-white font-semibold text-sm">
                JD
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading data...</span>
            </div>
          )}

          {hasError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
              <p>Error loading data: {financeError || investmentsError}</p>
            </div>
          )}

          {!isLoading && !hasError && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
              {/* Smart Financial Coach Card */}
              <SmartFinancialCoachCard
                currentWeekSpending={currentWeekSpending}
                previousWeekSpending={previousWeekSpending}
                topSpendingCategories={topSpendingCategories}
                totalBudgetedMonthly={totalBudgetedMonthly}
                totalSpentMonthly={totalSpentMonthly}
                currentMonthTransactions={currentMonthTransactions}
              />

              {/* Micro-Investing Suggestion Card */}
              {showMicroInvestingSuggestion && (
                <MicroInvestingSuggestionCard
                  weeklyRemainingBudget={weeklyBudgetTarget - currentWeekSpending}
                  weeklyBudgetTarget={weeklyBudgetTarget}
                  microInvestingPercentage={budgetSettings.microInvestingPercentage || 30}
                  microInvestingEnabled={budgetSettings.microInvestingEnabled ?? true}
                  existingInvestments={investments}
                  onInvest={handleMicroInvest}
                  onDismiss={() => setShowMicroInvestingSuggestion(false)}
                />
              )}

              {/* Monthly Remaining Budget Card */}
              <RemainingBudgetCard
                totalBudgeted={totalBudgeted}
                totalSpent={totalSpent}
                remainingBudget={remainingBudget}
                remainingPerDay={remainingPerDay}
                daysLeft={daysLeft}
                rolloverEnabled={budgetSettings.rolloverEnabled}
                previousMonthLeftover={budgetSettings.previousMonthLeftover}
              />

              {/* Category Overview Card */}
              <CategoryOverviewCard
                categories={categories}
                totalBudgetedMonthly={totalBudgetedMonthly}
                totalSpentMonthly={totalSpentMonthly}
              />

              {/* Total Investment Portfolio Card */}
              <Card className="card-shadow border-none bg-card text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Investment Portfolio</p>
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-4xl font-bold mb-1">{formatUSD(overallPortfolioSummary.currentValue)}</p>
                  <div className="flex items-center space-x-2">
                    {PortfolioGainLossIcon && <PortfolioGainLossIcon className={`w-4 h-4 ${portfolioGainLossColor}`} />}
                    <span className={`text-sm ${portfolioGainLossColor}`}>
                      {overallPortfolioSummary.totalGainLossPercentage.toFixed(2)}% this month
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setIsQuickAddModalOpen(true)} className="flex flex-col h-auto py-4 items-center justify-center text-center bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm transition-transform hover:scale-[1.02] active:scale-98">
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Add Expense</span>
                </Button>
                <Button onClick={() => setIsAddInvestmentModalOpen(true)} className="flex flex-col h-auto py-4 items-center justify-center text-center bg-emerald hover:bg-emerald/90 dark:bg-emerald dark:hover:bg-emerald/90 text-white rounded-xl shadow-sm transition-transform hover:scale-[1.02] active:scale-98">
                  <DollarSign className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Add Investment</span>
                </Button>
              </div>

              {/* Top 3 Performing Assets */}
              {topPerformers.length > 0 && (
                <Card className="card-shadow border-none bg-card animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Top 3 Performers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topPerformers.map(inv => {
                      const { gainLossPercentage } = calculateGainLoss(inv);
                      const isPositive = gainLossPercentage >= 0;
                      const gainLossColor = isPositive ? 'text-arrowUp' : 'text-arrowDown';
                      const Icon = isPositive ? TrendingUp : TrendingDown;
                      const priceChangeStatus = priceChange.get(inv.id) || 'none';
                      const priceChangeClasses = {
                        up: 'animate-pulse-green',
                        down: 'animate-pulse-red',
                        none: '',
                      };

                      return (
                        <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              inv.type === 'Stock' ? 'bg-blue/10 text-blue dark:bg-blue/20 dark:text-blue' : 'bg-lilac/10 text-lilac dark:bg-lilac/20 dark:text-lilac'
                            }`}>
                              {inv.type === 'Stock' ? <DollarSign className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{inv.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{inv.type}</p>
                            </div>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <div className={`flex items-center justify-end rounded-full px-2 py-1 ${isPositive ? 'bg-arrowUp/10' : 'bg-arrowDown/10'} ${priceChangeClasses[priceChangeStatus]} animate-float-up-down`}>
                              <Icon className={`w-3 h-3 mr-1 ${gainLossColor}`} />
                              <p className={`font-semibold text-sm ${gainLossColor}`}>
                                {gainLossPercentage.toFixed(2)}%
                              </p>
                            </div>
                            <p className={`text-xs ${gainLossColor} mt-1 ${priceChangeClasses[priceChangeStatus]}`}>{formatUSD(inv.quantity * inv.currentPrice)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Overall Allocation Chart Preview */}
              <EnhancedPortfolioAllocationChart
                title="Portfolio Allocation"
                data={overallAllocationData}
                emptyMessage="No data to display."
                totalPortfolioValue={overallPortfolioSummary.currentValue}
              />
            </div>
          )}
        </main>
        <BottomNavBar />
      </div>

      {/* Modals */}
      <QuickAddTransactionModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSave={handleQuickAddTransaction}
        categories={categories}
      />

      <AddInvestmentModal
        isOpen={isAddInvestmentModalOpen}
        onClose={() => setIsAddInvestmentModalOpen(false)}
        onSave={handleSaveNewInvestment}
        onDelete={handleDeleteInvestment}
        investmentToEdit={null}
      />
    </div>
  );
};

export default Index;