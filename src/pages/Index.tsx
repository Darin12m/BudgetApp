"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, TrendingUp, TrendingDown, DollarSign, Wallet, List, LucideIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFinanceData } from '@/hooks/use-finance-data';
import { useInvestmentData, Investment } from '@/hooks/use-investment-data';
import { formatCurrency, calculateGainLoss } from '@/lib/utils';
import RemainingBudgetCard from '@/components/RemainingBudgetCard';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import AddInvestmentModal from '@/components/AddInvestmentModal'; // New modal for investments
import BottomNavBar from '@/components/BottomNavBar'; // New bottom navigation

interface IndexPageProps {
  userUid: string | null;
}

const ALLOCATION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const Index: React.FC<IndexPageProps> = ({ userUid }) => {
  const {
    transactions, // Needed for quick add default account
    budgetSettings,
    totalBudgeted,
    totalSpent,
    remainingBudget,
    remainingPerDay,
    daysLeft,
    addDocument, // For quick add transaction
    loading: financeLoading,
    error: financeError,
  } = useFinanceData(userUid);

  const {
    investments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    priceChange,
    loading: investmentsLoading,
    error: investmentsError,
  } = useInvestmentData(userUid);

  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isAddInvestmentModalOpen, setIsAddInvestmentModalOpen] = useState(false);

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
  const handleQuickAddTransaction = useCallback(async (amount: number, note: string, date: string) => {
    await addDocument('transactions', {
      date: date,
      merchant: note || 'Quick Add',
      amount: amount,
      category: 'Uncategorized',
      status: 'pending',
      account: transactions.length > 0 ? transactions[0].account : 'Default Account', // Use an existing account or default
    });
  }, [addDocument, transactions]);

  const handleSaveNewInvestment = useCallback(async (newInvestment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => {
    await addInvestment(newInvestment);
  }, [addInvestment]);

  const handleDeleteInvestment = useCallback(async (id: string) => {
    await deleteInvestment(id);
  }, [deleteInvestment]);

  const handleEditInvestment = useCallback(async (id: string, updatedData: Partial<Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>>) => {
    await updateInvestment(id, updatedData);
  }, [updateInvestment]);

  const isLoading = financeLoading || investmentsLoading;
  const hasError = financeError || investmentsError;

  const portfolioGainLossColor = overallPortfolioSummary.totalGainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600';
  const PortfolioGainLossIcon: LucideIcon = overallPortfolioSummary.totalGainLossPercentage >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading data...</span>
          </div>
        )}

        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p>Error loading data: {financeError || investmentsError}</p>
          </div>
        )}

        {!isLoading && !hasError && (
          <>
            {/* Monthly Remaining Budget Card */}
            <RemainingBudgetCard
              totalBudgeted={totalBudgeted}
              totalSpent={totalSpent}
              remainingBudget={remainingBudget}
              remainingPerDay={remainingPerDay}
              daysLeft={daysLeft}
              rolloverEnabled={budgetSettings.rolloverEnabled}
              previousMonthLeftover={budgetSettings.previousMonthLeftover}
              smartSummary="Your budget at a glance."
            />

            {/* Total Investment Portfolio Card */}
            <Card className="shadow-sm border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600 text-white animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-blue-100">Total Investment Portfolio</p>
                  <Wallet className="h-5 w-5 text-blue-100" />
                </div>
                <p className="text-4xl font-bold mb-1">{formatCurrency(overallPortfolioSummary.currentValue)}</p>
                <div className="flex items-center space-x-2">
                  {PortfolioGainLossIcon && <PortfolioGainLossIcon className={`w-4 h-4 ${portfolioGainLossColor}`} />}
                  <span className={`text-sm ${portfolioGainLossColor}`}>
                    {overallPortfolioSummary.totalGainLossPercentage.toFixed(2)}% this month
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-4">
              <Button onClick={() => setIsQuickAddModalOpen(true)} className="flex flex-col h-auto py-4 items-center justify-center text-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
                <Plus className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Add Expense</span>
              </Button>
              <Button onClick={() => setIsAddInvestmentModalOpen(true)} className="flex flex-col h-auto py-4 items-center justify-center text-center bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm">
                <DollarSign className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Add Investment</span>
              </Button>
              <Link to="/budget-app?view=transactions" className="flex flex-col h-auto py-4 items-center justify-center text-center bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl shadow-sm">
                <List className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">View Activity</span>
              </Link>
            </div>

            {/* Top 3 Performing Assets */}
            {topPerformers.length > 0 && (
              <Card className="shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Top 3 Performers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPerformers.map(inv => {
                    const { gainLossPercentage } = calculateGainLoss(inv);
                    const isPositive = gainLossPercentage >= 0;
                    const gainLossColor = isPositive ? 'text-green-600' : 'text-red-600';
                    const Icon = isPositive ? TrendingUp : TrendingDown;
                    const priceChangeStatus = priceChange.get(inv.id) || 'none';
                    const priceChangeClasses = {
                      up: 'animate-pulse-green',
                      down: 'animate-pulse-red',
                      none: '',
                    };

                    return (
                      <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors active:bg-gray-100">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            inv.type === 'Stock' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {inv.type === 'Stock' ? <DollarSign className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{inv.name}</p>
                            <p className="text-xs text-gray-500 truncate">{inv.type}</p>
                          </div>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <p className={`font-semibold text-sm ${gainLossColor} flex items-center justify-end ${priceChangeClasses[priceChangeStatus]}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {gainLossPercentage.toFixed(2)}%
                          </p>
                          <p className={`text-xs ${gainLossColor} ${priceChangeClasses[priceChangeStatus]}`}>{formatCurrency(inv.quantity * inv.currentPrice)}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Overall Allocation Chart Preview */}
            {overallAllocationData.length > 0 && (
              <Card className="shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Portfolio Allocation</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overallAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {overallAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <QuickAddTransactionModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSave={handleQuickAddTransaction}
      />

      <AddInvestmentModal
        isOpen={isAddInvestmentModalOpen}
        onClose={() => setIsAddInvestmentModalOpen(false)}
        onSave={handleSaveNewInvestment}
        onDelete={handleDeleteInvestment} // Pass through, though not used for 'add'
        investmentToEdit={null} // For adding new, no investment to edit
      />

      <BottomNavBar />
    </div>
  );
};

export default Index;