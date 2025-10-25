"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Menu, Lightbulb, TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useFinanceData, Goal, Category, Transaction, Account, RecurringTransaction } from '@/hooks/use-finance-data';
import { useCurrency } from '@/context/CurrencyContext';
import { useDateRange } from '@/context/DateRangeContext';

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


interface BudgetAppProps {
  userUid: string | null;
}

interface ChartData {
  month: string;
  spent: number;
  budget: number;
}

interface NetWorthData {
  month: string;
  value: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

const FinanceFlow: React.FC<BudgetAppProps> = ({ userUid }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { selectedRange } = useDateRange();

  const {
    transactions,
    categories,
    accounts,
    goals,
    recurringTransactions: recurringTemplates,
    budgetSettings,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
  } = useFinanceData(userUid, selectedRange.from, selectedRange.to);

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState<boolean>(false);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState<string>('');
  const [transactionFilterPeriod, setTransactionFilterPeriod] = useState<'all' | 'thisMonth'>('thisMonth');

  // State for Category Modals
  const [isAddEditCategoryModalOpen, setIsAddEditCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // State for Goal Modals
  const [isAddEditGoalModalOpen, setIsAddEditGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [goalToFund, setGoalToFund] = useState<Goal | null>(null);

  // State for Transaction Modals
  const [isAddEditTransactionModalOpen, setIsAddEditTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);


  useEffect(() => {
    if (location.pathname === '/budget-app') {
      const params = new URLSearchParams(location.search);
      setActiveView(params.get('view') || 'dashboard');
    }
  }, [location.pathname, location.search]);

  const totalRecurring = useMemo(() =>
    recurringTemplates.reduce((sum, txn) => sum + Math.abs(txn.amount), 0),
    [recurringTemplates]
  );

  const netWorth = useMemo(() =>
    accounts.reduce((sum, acc) => sum + acc.balance, 0),
    [accounts]
  );

  // Placeholder data for charts (can be replaced with real data from Firestore later)
  const spendingTrend: ChartData[] = useMemo(() => [
    { month: 'Apr', spent: 2800, budget: 3000 },
    { month: 'May', spent: 2950, budget: 3000 },
    { month: 'Jun', spent: 2650, budget: 3000 },
    { month: 'Jul', spent: 3100, budget: 3200 },
    { month: 'Aug', spent: 2900, budget: 3200 },
    { month: 'Sep', spent: 2750, budget: 3000 },
    { month: 'Oct', spent: 1257.59, budget: 3000 },
  ], []);

  const netWorthTrend: NetWorthData[] = useMemo(() => [
    { month: 'Apr', value: 35000 },
    { month: 'May', value: 36200 },
    { month: 'Jun', value: 37100 },
    { month: 'Jul', value: 37800 },
    { month: 'Aug', value: 38500 },
    { month: 'Sep', value: 38900 },
    { month: 'Oct', value: 39202.78 },
  ], []);

  const totalBudgeted = useMemo(() =>
    (budgetSettings?.totalBudgeted || 0) + categories.reduce((sum, cat) => sum + cat.budgeted, 0),
    [categories, budgetSettings?.totalBudgeted]
  );

  const totalSpent = useMemo(() =>
    categories.reduce((sum, cat) => sum + cat.spent, 0),
    [categories]
  );

  const remainingBudget = useMemo(() =>
    budgetSettings.rolloverEnabled
      ? totalBudgeted - totalSpent + budgetSettings.previousMonthLeftover
      : totalBudgeted - totalSpent,
    [totalBudgeted, totalSpent, budgetSettings]
  );

  const today = new Date();
  const endOfCurrentMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = Math.ceil((endOfCurrentMonthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const remainingPerDay = useMemo(() =>
    remainingBudget / daysLeft,
    [remainingBudget, daysLeft]
  );

  const categoryData: CategoryData[] = useMemo(() =>
    categories.map(cat => ({
      name: cat.name,
      value: cat.spent,
      color: cat.color,
    })),
    [categories]
  );

  const smartSummary = useMemo(() => {
    if (totalBudgeted === 0) return "Set up your budget to get insights!";
    const spentPercentage = (totalSpent / totalBudgeted) * 100;
    if (remainingBudget < 0) {
      return `You are ${formatCurrency(Math.abs(remainingBudget))} over budget!`;
    } else if (spentPercentage >= 80) {
      return `You've spent ${Math.round(spentPercentage)}% of your budget. Be careful!`;
    } else if (remainingBudget > 0 && daysLeft > 0) {
      return `${formatCurrency(remainingBudget)} left for ${daysLeft} days. On track!`;
    }
    return "On track to stay under budget this month.";
  }, [totalBudgeted, totalSpent, remainingBudget, daysLeft, formatCurrency]);

  // --- Smart Forecast Calculations ---
  const currentMonthDate = useMemo(() => new Date(), []);
  const currentMonthYearForForecast = useMemo(() => format(currentMonthDate, 'MMMM yyyy'), [currentMonthDate]);

  const filteredTransactionsForForecast = useMemo(() => {
    return transactions.filter(txn => {
      const txnDate = parseISO(txn.date);
      return isWithinInterval(txnDate, { start: startOfMonth(currentMonthDate), end: endOfMonth(currentMonthDate) });
    });
  }, [transactions, currentMonthDate]);

  const totalExpensesThisMonth = useMemo(() => {
    return filteredTransactionsForForecast
      .filter(txn => txn.amount < 0)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  }, [filteredTransactionsForForecast]);

  const daysPassedThisMonthForForecast = currentMonthDate.getDate();
  const totalDaysInMonthForForecast = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();

  const dailyAvgSpending = daysPassedThisMonthForForecast > 0 ? totalExpensesThisMonth / daysPassedThisMonthForForecast : 0;
  const forecastedTotalSpending = dailyAvgSpending * totalDaysInMonthForForecast;
  const forecastedRemainingBalance = totalBudgeted - forecastedTotalSpending;

  const { runOutMessage, runOutColor, runOutIcon: RunOutIcon } = useMemo(() => {
    let message = '';
    let color = 'text-foreground';
    let icon: LucideIcon = Lightbulb;

    if (totalBudgeted === 0 || dailyAvgSpending === 0 || daysPassedThisMonthForForecast === 0) {
      message = "No forecast available yet. Add some transactions and set a budget!";
    } else if (forecastedRemainingBalance >= 0) {
      message = `At your current pace, you’ll have ${formatCurrency(forecastedRemainingBalance)} left at the end of the month.`;
      color = 'text-emerald';
      icon = TrendingUp;
    } else {
      const remainingBudgetBeforeForecast = totalBudgeted - totalExpensesThisMonth;
      if (remainingBudgetBeforeForecast <= 0) {
        message = `You are already ${formatCurrency(Math.abs(remainingBudgetBeforeForecast))} over budget this month.`;
        color = 'text-destructive';
        icon = TrendingDown;
      } else {
        const daysToRunOut = remainingBudgetBeforeForecast / dailyAvgSpending;
        const projectedRunOutDate = addDays(currentMonthDate, daysToRunOut);
        message = `At your current pace, you’ll run out of money on ${format(projectedRunOutDate, 'MMMM dd')}.`;
        color = 'text-destructive';
        icon = TrendingDown;
      }
    }
    return { runOutMessage: message, runOutColor: color, runOutIcon: icon };
  }, [totalBudgeted, dailyAvgSpending, daysPassedThisMonthForForecast, forecastedRemainingBalance, totalExpensesThisMonth, currentMonthDate, formatCurrency]);

  const spendingForecastChartData = useMemo(() => {
    const data = [];
    let cumulativeActualSpent = 0;
    const currentDay = new Date().getDate();
    const totalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const sortedTransactions = filteredTransactionsForForecast
      .filter(txn => txn.amount < 0)
      .map(txn => ({ ...txn, date: new Date(txn.date) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const actualCumulativeByDay: { [key: number]: number } = {};
    for (let day = 1; day <= currentDay; day++) {
      cumulativeActualSpent += sortedTransactions
        .filter(txn => txn.date.getDate() === day)
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
      actualCumulativeByDay[day] = cumulativeActualSpent;
    }

    for (let day = 1; day <= totalDays; day++) {
      const dayData: { day: number; actual?: number; forecast?: number } = { day };

      if (day <= currentDay) {
        dayData.actual = actualCumulativeByDay[day];
        dayData.forecast = actualCumulativeByDay[day];
      } else {
        dayData.actual = undefined;
        if (dailyAvgSpending > 0) {
          dayData.forecast = actualCumulativeByDay[currentDay] + (dailyAvgSpending * (day - currentDay));
        } else {
          dayData.forecast = actualCumulativeByDay[currentDay];
        }
      }
      data.push(dayData);
    }
    return data;
  }, [filteredTransactionsForForecast, dailyAvgSpending]);


  const handleViewChange = useCallback((view: string) => {
    setActiveView(view);
    setSidebarOpen(false);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // --- Transaction Handlers ---
  const handleQuickAddTransaction = useCallback(async (amount: number, merchant: string, date: string, categoryId: string, isRecurring: boolean, frequency?: 'Monthly' | 'Weekly' | 'Yearly', nextDate?: string) => {
    if (!userUid) {
      toast.error("You must be logged in to save data.");
      return;
    }

    const transactionPayload: Omit<Transaction, 'id' | 'ownerUid'> = {
      date: date,
      merchant: merchant || 'Quick Add',
      amount: amount,
      categoryId: categoryId,
      status: 'pending',
      // Removed account from payload
      isRecurring: isRecurring,
    };

    try {
      const transactionId = await addDocument('transactions', transactionPayload);
      if (transactionId && isRecurring && frequency && nextDate) {
        const categoryEmoji = categories.find(cat => cat.id === categoryId)?.emoji || '💳';
        await addDocument('recurringTransactions', {
          name: merchant || 'Quick Add',
          amount: amount,
          categoryId: categoryId,
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
  }, [addDocument, userUid, categories]); // Removed accounts from dependency array

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsAddEditTransactionModalOpen(true);
  }, []);

  const handleSaveTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'ownerUid'>, isRecurring: boolean, recurringDetails?: Omit<RecurringTransaction, 'id' | 'ownerUid'>) => {
    if (!userUid) {
      toast.error("User not authenticated.");
      return;
    }

    try {
      if (transactionToEdit) {
        // Update existing transaction
        await updateDocument('transactions', transactionToEdit.id, {
          ...transactionData,
          recurringTransactionId: transactionToEdit.recurringTransactionId,
        });
        toast.success("Transaction updated successfully!");

        const wasRecurringTemplate = recurringTemplates.some(rt => rt.id === transactionToEdit.recurringTransactionId);

        if (isRecurring && recurringDetails) {
          if (wasRecurringTemplate && transactionToEdit.recurringTransactionId) {
            await updateDocument('recurringTransactions', transactionToEdit.recurringTransactionId, recurringDetails);
            toast.success("Recurring template updated!");
          } else if (!wasRecurringTemplate) {
            const newRecurringId = await addDocument('recurringTransactions', { ...recurringDetails, ownerUid: userUid });
            if (newRecurringId) {
              await updateDocument('transactions', transactionToEdit.id, { isRecurring: true, recurringTransactionId: newRecurringId });
              toast.success("New recurring template added and linked!");
            }
          }
        } else if (wasRecurringTemplate && !isRecurring && transactionToEdit.recurringTransactionId) {
          await deleteDocument('recurringTransactions', transactionToEdit.recurringTransactionId);
          await updateDocument('transactions', transactionToEdit.id, { isRecurring: false, recurringTransactionId: null });
          toast.success("Recurring template removed!");
        }
      } else {
        // Add new transaction
        const newTransactionId = await addDocument('transactions', transactionData);
        if (newTransactionId && isRecurring && recurringDetails) {
          const newRecurringId = await addDocument('recurringTransactions', { ...recurringDetails, ownerUid: userUid });
          if (newRecurringId) {
            await updateDocument('transactions', newTransactionId, { isRecurring: true, recurringTransactionId: newRecurringId });
            toast.success("New recurring template added and linked!");
          }
        }
      }
      setIsAddEditTransactionModalOpen(false);
      setTransactionToEdit(null);
    } catch (e: any) {
      console.error("Error saving transaction:", e.code, e.message);
      toast.error(`Failed to save transaction: ${e.message}`);
    }
  }, [userUid, transactionToEdit, addDocument, updateDocument, deleteDocument, recurringTemplates, categories]); // Removed accounts from dependency array

  const handleDeleteTransaction = useCallback(async (transactionId: string) => {
    if (!userUid) {
      toast.error("User not authenticated.");
      return;
    }
    try {
      const transactionToDelete = transactions.find(t => t.id === transactionId);
      if (transactionToDelete && transactionToDelete.isRecurring && transactionToDelete.recurringTransactionId) {
        await deleteDocument('transactions', transactionId);
        toast.success("Transaction instance deleted successfully!");
      } else {
        await deleteDocument('transactions', transactionId);
        toast.success("Transaction deleted successfully!");
      }
      setIsAddEditTransactionModalOpen(false);
      setTransactionToEdit(null);
    } catch (e: any) {
      console.error("Error deleting transaction:", e.code, e.message);
      toast.error(`Failed to delete transaction: ${e.message}`);
    }
  }, [userUid, deleteDocument, transactions]);

  // --- Category Handlers ---
  const handleAddCategory = useCallback(() => {
    setCategoryToEdit(null);
    setIsAddEditCategoryModalOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: Category) => {
    setCategoryToEdit(category);
    setIsAddEditCategoryModalOpen(true);
  }, []);

  const handleSaveCategory = useCallback(async (categoryData: Omit<Category, 'spent' | 'ownerUid' | 'id'>, id?: string) => {
    if (!userUid) {
      toast.error("User not authenticated.");
      return;
    }

    try {
      if (id) {
        await updateDocument('categories', id, categoryData);
      } else {
        await addDocument('categories', { ...categoryData, spent: 0 });
      }
      setIsAddEditCategoryModalOpen(false);
      setCategoryToEdit(null);
    } catch (e: any) {
      console.error("Error saving category:", e.code, e.message);
      toast.error(`Failed to save category: ${e.message}`);
    }
  }, [userUid, addDocument, updateDocument]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    if (!userUid) {
      toast.error("User not authenticated.");
      return;
    }
    await deleteDocument('categories', categoryId);
  }, [userUid, deleteDocument]);

  // --- Goal Handlers ---
  const handleAddGoal = useCallback(() => {
    setGoalToEdit(null);
    setIsAddEditGoalModalOpen(true);
  }, []);

  const handleEditGoal = useCallback((goal: Goal) => {
    setGoalToEdit(goal);
    setIsAddEditGoalModalOpen(true);
  }, []);

  const handleSaveGoal = useCallback(async (goalData: Omit<Goal, 'ownerUid'>) => {
    if (!userUid) {
      toast.error("User not authenticated.");
      return;
    }
    if (goalToEdit) {
      await updateDocument('goals', goalToEdit.id, goalData);
    } else {
      await addDocument('goals', goalData);
    }
    setIsAddEditGoalModalOpen(false);
    setGoalToEdit(null);
  }, [userUid, goalToEdit, addDocument, updateDocument]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (!userUid) {
      toast.error("User not authenticated.");
      return;
    }
    await deleteDocument('goals', goalId);
  }, [userUid, deleteDocument]);

  const handleOpenAddFunds = useCallback((goal: Goal) => {
    setGoalToFund(goal);
    setIsAddFundsModalOpen(true);
  }, []);

  const handleAddFundsToGoal = useCallback(async (amount: number) => {
    if (!userUid || !goalToFund) {
      toast.error("User not authenticated or no goal selected.");
      return;
    }
    const newCurrentAmount = goalToFund.current + amount;
    await updateDocument('goals', goalToFund.id, { current: newCurrentAmount });
    setIsAddFundsModalOpen(false);
    setGoalToFund(null);
  }, [userUid, goalToFund, updateDocument]);


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
        // Removed accounts prop
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
          currentAmount={goalToFund.current}
          targetAmount={goalToFund.target}
        />
      )}
    </div>
  );
};

export default FinanceFlow;