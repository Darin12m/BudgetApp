"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Plus, TrendingUp, TrendingDown, DollarSign, Wallet, List, LucideIcon, Sun, Moon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFinanceData, Transaction, RecurringTransaction } from '@/hooks/use-finance-data';
import { useInvestmentData, Investment } from '@/hooks/use-investment-data';
import { calculateGainLoss, getStartOfCurrentWeek, getEndOfCurrentWeek } from '@/lib/utils';
import RemainingBudgetCard from '@/components/RemainingBudgetCard';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import AddInvestmentModal from '@/components/AddInvestmentModal';
import BottomNavBar from '@/components/BottomNavBar';
import MicroInvestingSuggestionCard from '@/components/MicroInvestingSuggestionCard';
import SmartFinancialCoachCard from '@/components/SmartFinancialCoachCard';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { format } from 'date-fns';
import { useCurrency } from '@/context/CurrencyContext';
import { useDateRange } from '@/context/DateRangeContext';
import EnhancedPortfolioAllocationChart from '@/components/investments/EnhancedPortfolioAllocationChart';
import CategoryOverviewCard from '@/components/dashboard/CategoryOverviewCard';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Import cn for conditional classNames

interface IndexPageProps {
  userUid: string | null;
  setShowProfilePopup: (show: boolean) => void; // New prop
}

const ALLOCATION_COLORS = ['hsl(var(--blue))', 'hsl(var(--emerald))', 'hsl(var(--lilac))', '#f59e0b', '#ef4444', '#06b6d4'];

const Index: React.FC<IndexPageProps> = ({ userUid, setShowProfilePopup }) => {
  const { t } = useTranslation();
  const { formatCurrency, formatUSD, selectedCurrency, convertInputToUSD } = useCurrency();
  const { selectedRange } = useDateRange();

  const {
    transactions,
    categories,
    accounts,
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
    if (stockValue > 0) data.push({ name: t("investments.stocks"), value: stockValue, color: ALLOCATION_COLORS[0] });
    if (cryptoValue > 0) data.push({ name: t("investments.crypto"), value: cryptoValue, color: ALLOCATION_COLORS[1] });
    return data;
  }, [investments, t]);

  // --- Dynamic Dashboard Greeting ---
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours();
    let greeting = t("dashboard.goodMorning");
    if (hour >= 12 && hour < 18) greeting = t("dashboard.goodAfternoon");
    if (hour >= 18 || hour < 5) greeting = t("dashboard.goodEvening");

    const userName = userUid ? (userUid.split('@')[0] || t("common.guest")) : t("common.guest"); // Basic name from email or 'Guest'

    let budgetMessage = '';
    if (totalBudgeted > 0) {
      const spentPercentage = (totalSpent / totalBudgeted) * 100;
      if (remainingBudget >= 0) {
        budgetMessage = t("dashboard.underBudget", { percentage: Math.round(100 - spentPercentage) });
      } else {
        budgetMessage = t("dashboard.overBudgetBy", { amount: formatCurrency(Math.abs(remainingBudget)) });
      }
    } else {
      budgetMessage = t("dashboard.noBudgetSet");
    }

    return `${greeting}, ${userName}. ${budgetMessage}`;
  }, [userUid, totalBudgeted, totalSpent, remainingBudget, formatCurrency, t]);


  // --- Handlers ---
  const handleQuickAddTransaction = useCallback(async (amountInUSD: number, merchant: string, date: string, categoryId: string, isRecurring: boolean, frequency?: 'Monthly' | 'Weekly' | 'Yearly', nextDate?: string, inputCurrencyCode?: string) => {
    if (!userUid) {
      toast.error(t("common.error"));
      return;
    }

    const transactionPayload: Omit<Transaction, 'id' | 'ownerUid'> = {
      date: date,
      merchant: merchant || t("transactions.quickAdd"),
      amount: amountInUSD,
      categoryId: categoryId,
      status: 'pending',
      isRecurring: isRecurring,
      inputCurrencyCode: inputCurrencyCode || selectedCurrency.code,
    };

    try {
      const transactionId = await addDocument('transactions', transactionPayload);
      if (transactionId && isRecurring && frequency && nextDate) {
        const categoryEmoji = categories.find(cat => cat.id === categoryId)?.emoji || '💳';
        await addDocument('recurringTransactions', {
          name: merchant || t("transactions.quickAdd"),
          amount: amountInUSD,
          categoryId: categoryId,
          frequency,
          nextDate,
          emoji: categoryEmoji,
          inputCurrencyCode: inputCurrencyCode || selectedCurrency.code,
        });
        toast.success(t("common.success"));
      }
    } catch (e: any) {
      console.error("Error adding transaction:", e.code, e.message);
      toast.error(t("common.error"));
    }
  }, [addDocument, userUid, categories, selectedCurrency.code, t]);

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
    const amountInUSD = convertInputToUSD(amount);

    const currentPrice = investments.find(inv => inv.name === assetName)?.currentPrice || 1;
    const quantity = amountInUSD / currentPrice;

    await addInvestment({
      name: assetName,
      type: assetType,
      quantity: quantity,
      buyPrice: currentPrice,
      currentPrice: currentPrice,
      datePurchased: format(new Date(), 'yyyy-MM-dd'),
      symbol: symbol,
      coingeckoId: coingeckoId,
      inputCurrencyCode: selectedCurrency.code,
    });
  }, [addInvestment, investments, convertInputToUSD, selectedCurrency.code]);

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
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} onViewChange={handleViewChange} userUid={userUid} setShowProfilePopup={setShowProfilePopup} />

      <div className={`flex flex-col flex-1 min-w-0 ${sidebarOpen ? 'sm:ml-72' : 'sm:ml-0'} transition-all duration-300 ease-in-out`}>
        <Header
          title={t("navigation.dashboard")}
          subtitle={dynamicGreeting}
          onSidebarToggle={handleSidebarToggle}
          setShowProfilePopup={setShowProfilePopup}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">{t("common.loading")}</span>
            </div>
          )}

          {hasError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
              <p>{t("common.error")}: {financeError || investmentsError}</p>
            </div>
          )}

          {!isLoading && !hasError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6 sm:space-y-8"
            >
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
                smartSummary={t("dashboard.budgetAtAGlance")}
              />

              {/* Category Overview Card */}
              <CategoryOverviewCard
                categories={categories}
                totalBudgetedMonthly={totalBudgetedMonthly}
                totalSpentMonthly={totalSpentMonthly}
              />

              {/* Total Investment Portfolio Card */}
              <OverallPortfolioSummaryCard
                currentValue={overallPortfolioSummary.currentValue}
                gainLossPercentage={overallPortfolioSummary.totalGainLossPercentage}
              />

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setIsQuickAddModalOpen(true)}
                  className={cn(
                    "flex flex-col h-auto py-4 items-center justify-center text-center rounded-xl shadow-sm transition-transform",
                    "glassmorphic-card text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                  )}
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{t("dashboard.addExpense")}</span>
                </Button>
                <Button
                  onClick={() => setIsAddInvestmentModalOpen(true)}
                  className={cn(
                    "flex flex-col h-auto py-4 items-center justify-center text-center rounded-xl shadow-sm transition-transform",
                    "glassmorphic-card text-emerald dark:text-emerald hover:bg-emerald/10 dark:hover:bg-emerald/20"
                  )}
                >
                  <DollarSign className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{t("dashboard.addInvestment")}</span>
                </Button>
              </div>

              {/* Top 3 Performing Assets */}
              {topPerformers.length > 0 && (
                <motion.div
                  className="glassmorphic-card"
                  whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <CardHeader>
                    <CardTitle className="h3 tracking-tight">{t("dashboard.topPerformers")}</CardTitle>
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
                        <motion.div
                          key={inv.id}
                          whileHover={{ scale: 1.01, backgroundColor: "hsl(var(--muted)/20%)" }}
                          whileTap={{ scale: 0.99 }}
                          className="flex items-center justify-between p-3 rounded-lg transition-colors"
                        >
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
                              <p className={`font-semibold text-sm ${gainLossColor} font-mono`}>
                                {gainLossPercentage.toFixed(2)}%
                              </p>
                            </div>
                            <p className={`text-xs ${gainLossColor} mt-1 ${priceChangeClasses[priceChangeStatus]} font-mono`}>{formatCurrency(inv.quantity * inv.currentPrice)}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </motion.div>
              )}

              {/* Overall Allocation Chart Preview */}
              <EnhancedPortfolioAllocationChart
                title={t("dashboard.portfolioAllocation")}
                data={overallAllocationData}
                emptyMessage={t("dashboard.noDataToDisplay")}
                totalPortfolioValue={overallPortfolioSummary.currentValue}
              />
            </motion.div>
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