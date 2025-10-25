"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

import Sidebar from '@/components/layout/Sidebar';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

// Modals
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import AddEditTransactionModal from '@/components/transactions/AddEditTransactionModal';
import AddEditCategoryModal from '@/components/budget/AddEditCategoryModal';
import AddEditGoalModal from '@/components/goals/AddEditGoalModal';
import AddFundsModal from '@/components/goals/AddFundsModal';

// View Components
import DashboardView from './budget-app-views/DashboardView';
import BudgetView from './budget-app-views/BudgetView';
import GoalsView from './budget-app-views/GoalsView';
import TransactionsView from './budget-app-views/TransactionsView';

// New custom hook
import { useBudgetAppLogic } from '@/hooks/use-budget-app-logic';


interface BudgetAppProps {
  userUid: string | null;
}

const FinanceFlow: React.FC<BudgetAppProps> = ({ userUid }) => {
  const navigate = useNavigate();
  const {
    // Data & Derived Values
    transactions,
    categories,
    accounts,
    goals,
    recurringTemplates,
    budgetSettings,
    loading,
    error,
    totalBudgeted,
    totalSpent,
    remainingBudget,
    daysLeft,
    remainingPerDay,
    categoryData,
    smartSummary,
    currentWeekSpending,
    previousWeekSpending,
    totalBudgetedMonthly,
    totalSpentMonthly,
    weeklyBudgetTarget,
    topSpendingCategories,
    currentMonthTransactions,
    runOutMessage,
    runOutColor,
    RunOutIcon,
    dailyAvgSpending,
    spendingForecastChartData,
    netWorth,
    spendingTrend,
    netWorthTrend,
    formatCurrency,

    // UI State
    activeView,
    sidebarOpen,
    isQuickAddModalOpen,
    transactionSearchTerm,
    transactionFilterPeriod,
    isAddEditCategoryModalOpen,
    categoryToEdit,
    isAddEditGoalModalOpen,
    goalToEdit,
    isAddFundsModalOpen,
    goalToFund,
    isAddEditTransactionModalOpen,
    transactionToEdit,

    // Handlers
    handleViewChange,
    handleSidebarToggle,
    handleCloseSidebar,
    setIsQuickAddModalOpen,
    setTransactionSearchTerm,
    setTransactionFilterPeriod,
    setIsAddEditTransactionModalOpen,
    handleEditTransaction,
    handleSaveTransaction,
    handleDeleteTransaction,
    handleAddCategory,
    handleEditCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleAddGoal,
    handleEditGoal,
    handleSaveGoal,
    handleDeleteGoal,
    handleOpenAddFunds,
    handleAddFundsToGoal,
    handleQuickAddTransaction,
  } = useBudgetAppLogic(userUid);


  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} onViewChange={(view) => {
        if (view === 'dashboard') navigate('/');
        else if (view === 'investments') navigate('/investments');
        else if (view === 'settings') navigate('/settings');
        else handleViewChange(view);
      }} userUid={userUid} />

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
                <h2 className="text-lg sm:text-xl font-semibold text-foreground capitalize truncate">{activeView}</h2>
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
          {error && <ErrorMessage message={error} />}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView
                  totalBudgeted={totalBudgeted}
                  totalSpent={totalSpent}
                  remainingBudget={remainingBudget}
                  remainingPerDay={remainingPerDay}
                  daysLeft={daysLeft}
                  budgetSettings={budgetSettings}
                  smartSummary={smartSummary}
                  runOutIcon={RunOutIcon}
                  runOutColor={runOutColor}
                  runOutMessage={runOutMessage}
                  dailyAvgSpending={dailyAvgSpending}
                  spendingForecastChartData={spendingForecastChartData}
                  netWorth={netWorth}
                  accounts={accounts}
                  spendingTrend={spendingTrend}
                  categoryData={categoryData}
                  recurringTransactions={recurringTemplates}
                  transactions={transactions}
                  categories={categories}
                  formatCurrency={formatCurrency}
                  netWorthTrend={netWorthTrend}
                />
              )}
              {activeView === 'budget' && (
                <BudgetView
                  totalBudgeted={totalBudgeted}
                  totalSpent={totalSpent}
                  remainingBudget={remainingBudget}
                  remainingPerDay={remainingPerDay}
                  daysLeft={daysLeft}
                  budgetSettings={budgetSettings}
                  formatCurrency={formatCurrency}
                  categories={categories}
                  handleAddCategory={handleAddCategory}
                  handleEditCategory={handleEditCategory}
                  handleDeleteCategory={handleDeleteCategory}
                />
              )}
              {activeView === 'goals' && (
                <GoalsView
                  goals={goals}
                  handleAddGoal={handleAddGoal}
                  handleEditGoal={handleEditGoal}
                  handleDeleteGoal={handleDeleteGoal}
                  handleOpenAddFunds={handleOpenAddFunds}
                  formatCurrency={formatCurrency}
                />
              )}
              {activeView === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  categories={categories}
                  transactionSearchTerm={transactionSearchTerm}
                  setTransactionSearchTerm={setTransactionSearchTerm}
                  transactionFilterPeriod={transactionFilterPeriod}
                  setTransactionFilterPeriod={setTransactionFilterPeriod}
                  setIsAddEditTransactionModalOpen={setIsAddEditTransactionModalOpen}
                  handleEditTransaction={handleEditTransaction}
                  formatCurrency={formatCurrency}
                />
              )}
            </>
          )}
        </main>
      </div>

      <QuickAddTransactionModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSave={handleQuickAddTransaction}
        categories={categories}
      />

      <AddEditTransactionModal
        isOpen={isAddEditTransactionModalOpen}
        onClose={() => setIsAddEditTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        transactionToEdit={transactionToEdit}
        categories={categories}
        recurringTemplates={recurringTemplates}
      />

      <AddEditCategoryModal
        isOpen={isAddEditCategoryModalOpen}
        onClose={() => setIsAddEditCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
        existingCategoryNames={categories.map(cat => cat.name)}
      />

      <AddEditGoalModal
        isOpen={isAddEditGoalModalOpen}
        onClose={() => setIsAddEditGoalModalOpen(false)}
        onSave={handleSaveGoal}
        goalToEdit={goalToEdit}
      />

      {goalToFund && (
        <AddFundsModal
          isOpen={isAddFundsModalOpen}
          onClose={() => setIsAddFundsModalOpen(false)}
          onAddFunds={handleAddFundsToGoal}
          goalName={goalToFund.name}
          currentAmountInUSD={goalToFund.current}
          targetAmountInUSD={goalToFund.target}
        />
      )}
    </div>
  );
};

export default FinanceFlow;