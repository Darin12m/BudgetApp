import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, AlertCircle, Calendar, PiggyBank, Menu, X, Plus, ArrowRight, Settings, Bell, Home, List, BarChart3, ChevronRight, Wallet, Search, Lightbulb, Zap, LucideIcon, Edit, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useFinanceData } from '@/hooks/use-finance-data';
import { formatDate } from '@/lib/utils';
import RemainingBudgetCard from '@/components/RemainingBudgetCard';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import Sidebar from '@/components/layout/Sidebar';
import AddEditCategoryModal from '@/components/budget/AddEditCategoryModal';
import AddEditGoalModal from '@/components/goals/AddEditGoalModal';
import AddFundsModal from '@/components/goals/AddFundsModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrency } from '@/context/CurrencyContext';
import { useDateRange } from '@/context/DateRangeContext'; // Import useDateRange
import { DateRangePicker } from '@/components/common/DateRangePicker'; // Import DateRangePicker

// TypeScript Interfaces (moved to use-finance-data.tsx for centralized management)
interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  status: 'pending' | 'cleared';
  account: string;
  ownerUid: string;
}

interface Category {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
  emoji: string;
  ownerUid: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  lastUpdated: string;
  ownerUid: string;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
  targetDate: string; // YYYY-MM-DD
  ownerUid: string;
}

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'Monthly' | 'Weekly' | 'Yearly';
  nextDate: string;
  emoji: string;
  ownerUid: string;
}

interface HealthStatus {
  status: 'over' | 'warning' | 'good';
  color: string;
  bg: string;
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

// Utility Functions
const getHealthStatus = (spent: number, budgeted: number): HealthStatus => {
  const percentage = (spent / budgeted) * 100;
  if (percentage >= 100) return { status: 'over', color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-900/20' };
  if (percentage >= 80) return { status: 'warning', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' };
  return { status: 'good', color: 'text-emerald', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
};

interface BudgetAppProps {
  userUid: string | null;
}

const FinanceFlow: React.FC<BudgetAppProps> = ({ userUid }) => {
  const location = useLocation();
  const { formatCurrency } = useCurrency();
  const { selectedRange, goToPreviousPeriod, goToNextPeriod } = useDateRange(); // Use date range context

  const {
    transactions,
    categories,
    accounts,
    goals,
    recurringTransactions,
    budgetSettings,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
  } = useFinanceData(userUid, selectedRange.from, selectedRange.to); // Pass selected range to useFinanceData

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MMMM yyyy')); // This will be replaced by selectedRange.label for the header
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


  useEffect(() => {
    if (location.pathname === '/budget-app') {
      const params = new URLSearchParams(location.search);
      setActiveView(params.get('view') || 'dashboard');
    }
  }, [location.pathname, location.search]);

  const totalRecurring = useMemo(() =>
    recurringTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0),
    [recurringTransactions]
  );

  const netWorth = useMemo(() =>
    accounts.reduce((sum, acc) => sum + acc.balance, 0),
    [accounts]
  );

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
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = Math.ceil((endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
    // Filter transactions based on the current month, not the selectedRange
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
  // --- End Smart Forecast Calculations ---


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

  const handleQuickAddTransaction = useCallback(async (amount: number, note: string, date: string) => {
    await addDocument('transactions', {
      date: date,
      merchant: note || 'Quick Add',
      amount: amount,
      category: 'Uncategorized',
      status: 'pending',
      account: accounts.length > 0 ? accounts[0].name : 'Default Account',
    });
  }, [addDocument, accounts]);

  // --- Category Handlers ---
  const handleAddCategory = useCallback(() => {
    setCategoryToEdit(null);
    setIsAddEditCategoryModalOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: Category) => {
    setCategoryToEdit(category);
    setIsAddEditCategoryModalOpen(true);
  }, []);

  const handleSaveCategory = useCallback(async (categoryData: Omit<Category, 'spent' | 'ownerUid'>) => {
    if (!userUid) {
      toast.error("User not authenticated.");
      return;
    }
    if (categoryToEdit) {
      await updateDocument('categories', categoryToEdit.id, categoryData);
    } else {
      await addDocument('categories', { ...categoryData, spent: 0 }); // New categories start with 0 spent
    }
    setIsAddEditCategoryModalOpen(false);
    setCategoryToEdit(null);
  }, [userUid, categoryToEdit, addDocument, updateDocument]);

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


  const LoadingSpinner: React.FC = memo(() => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2 text-muted-foreground">Loading data...</span>
    </div>
  ));

  const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = memo(({ error, onRetry }) => (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 m-4">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-destructive mr-2" />
        <div>
          <h3 className="text-sm font-medium text-destructive">Error loading data</h3>
          <p className="text-sm text-destructive mt-1">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  ));

  const StatsCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    trend?: { value: string; color: string };
  }> = memo(({ title, value, subtitle, icon: Icon, color, bgColor, trend }) => (
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
          {trend && (
            <p className={`text-xs ${trend.color} mt-1 flex items-center`}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend.value}
            </p>
          )}
        </div>
        <div className="hidden sm:flex w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: bgColor }}>
          <div style={{ color }}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
      {trend && (
        <div className="text-xs text-muted-foreground flex items-center mt-2">
          <div className="w-2 h-2 bg-emerald rounded-full mr-2 animate-pulse"></div>
          Auto-updated {accounts.length > 0 ? accounts[0].lastUpdated : 'N/A'}
        </div>
      )}
    </div>
  ));

  const TransactionCard: React.FC<{ transaction: Transaction; categories: Category[] }> = memo(({ transaction, categories }) => {
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
        <div className="text-right ml-2 flex-shrink-0">
          <p className={`font-semibold text-sm ${transaction.amount > 0 ? 'text-emerald' : 'text-foreground'}`}>
            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
          </p>
        </div>
      </div>
    );
  });

  const CategoryCard: React.FC<{ category: Category; onEdit: (category: Category) => void; onDelete: (id: string) => void }> = memo(({ category, onEdit, onDelete }) => {
    const percentage = (category.spent / category.budgeted) * 100;
    const health = getHealthStatus(category.spent, category.budgeted);

    return (
      <div className="p-4 sm:p-6 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{category.emoji}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{category.name}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatCurrency(category.spent)} of {formatCurrency(category.budgeted)}
              </p>
            </div>
          </div>
          <div className="text-right ml-2 flex-shrink-0 flex items-center space-x-2">
            <p className={`font-semibold text-sm sm:text-base ${health.color}`}>
              {formatCurrency(category.budgeted - category.spent)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{Math.round(percentage)}%</p>
            <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-8 w-8 text-muted-foreground hover:bg-muted/50">
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card text-foreground card-shadow border border-border/50 backdrop-blur-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the category "{category.name}" and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(category.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="relative">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: category.color
              }}
            />
          </div>
        </div>
      </div>
    );
  });

  const DashboardView: React.FC = () => (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
      <RemainingBudgetCard
        totalBudgeted={totalBudgeted}
        totalSpent={totalSpent}
        remainingBudget={remainingBudget}
        remainingPerDay={remainingPerDay}
        daysLeft={daysLeft}
        rolloverEnabled={budgetSettings.rolloverEnabled}
        previousMonthLeftover={budgetSettings.previousMonthLeftover}
        smartSummary={smartSummary}
      />

      {/* Smart Forecast Card */}
      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
        <div className="flex items-center space-x-3 mb-3">
          {RunOutIcon && <RunOutIcon className={`w-5 h-5 ${runOutColor}`} />}
          <h3 className={`text-base sm:text-lg font-semibold ${runOutColor}`}>Smart Forecast</h3>
        </div>
        <p className={`text-sm sm:text-base ${runOutColor} mb-4`}>{runOutMessage}</p>

        {totalBudgeted > 0 && dailyAvgSpending > 0 && (
          <>
            <h4 className="text-sm font-semibold text-foreground mb-2">Spending Trajectory</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={spendingForecastChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickFormatter={(value) => formatCurrency(Number(value))} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--tooltip-text-color))' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual Spent" dot={false} />
                <Line type="monotone" dataKey="forecast" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" name="Forecasted Spent" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Net Worth"
          value={formatCurrency(netWorth)}
          icon={TrendingUp}
          color="hsl(var(--emerald))"
          bgColor="hsl(var(--emerald)/10%)"
          trend={{ value: "+3.2%", color: "text-emerald" }}
        />
        <StatsCard
          title="Spent"
          value={formatCurrency(totalSpent)}
          subtitle={`of ${formatCurrency(totalBudgeted)}`}
          icon={DollarSign}
          color="hsl(var(--primary))"
          bgColor="hsl(var(--primary)/10%)"
        />
        <StatsCard
          title="Remaining"
          value={formatCurrency(remainingBudget)}
          subtitle={`${Math.round((remainingBudget / totalBudgeted) * 100)}%`}
          icon={PiggyBank}
          color="hsl(var(--emerald))"
          bgColor="hsl(var(--emerald)/10%)"
        />
        <StatsCard
          title="Accounts"
          value={accounts.length.toString()}
          subtitle="Connected"
          icon={CreditCard}
          color="hsl(var(--lilac))"
          bgColor="hsl(var(--lilac)/10%)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--tooltip-text-color))' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Line type="monotone" dataKey="spent" stroke="hsl(var(--primary))" strokeWidth={2} name="Spent" dot={false} />
              <Line type="monotone" dataKey="budget" stroke="hsl(var(--emerald))" strokeWidth={2} strokeDasharray="5 5" name="Budget" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Spending by Category</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  // Removed label prop to prevent overlap
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--tooltip-text-color))' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="hidden sm:block bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Net Worth Growth</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={netWorthTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--tooltip-text-color))' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar dataKey="value" fill="hsl(var(--emerald))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Upcoming Recurring Bills</h3>
            <p className="text-sm text-muted-foreground mt-1">Total: {formatCurrency(totalRecurring)}/month</p>
          </div>
          <Link to="/budget-app?view=recurring" className="text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:text-primary/90 font-medium flex items-center">
            Manage
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {recurringTransactions.slice(0, 5).map(txn => (
            <div key={txn.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-lilac/10 rounded-full flex items-center justify-center flex-shrink-0 text-lilac">
                  <span className="text-lg">{txn.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{txn.name}</p>
                  <p className="text-xs text-muted-foreground">{txn.frequency} • Due {txn.nextDate}</p>
                </div>
              </div>
              <div className="text-right ml-2 flex-shrink-0">
                <p className="font-semibold text-sm text-foreground">{formatCurrency(txn.amount)}</p>
                <span className="text-xs text-lilac font-medium">Auto-pay</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Recent Transactions</h3>
          <Link to="/budget-app?view=transactions" className="text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:text-primary/90 font-medium flex items-center">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {transactions.slice(0, 5).map(txn => (
            <div key={txn.id} className="p-4 active:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {txn.amount > 0 ? '💰' : categories.find(c => c.name === txn.category)?.emoji || '💳'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{txn.merchant}</p>
                    <p className="text-xs text-muted-foreground">{categories.find(c => c.name === txn.category)?.name || 'Uncategorized'}</p>
                  </div>
                </div>
                <p className={`font-bold text-sm ml-2 flex-shrink-0 ${txn.amount > 0 ? 'text-emerald' : 'text-foreground'}`}>
                  {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{txn.date}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  txn.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                }`}>
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
              <Button variant="ghost" size="icon" onClick={goToPreviousPeriod} className="h-9 w-9 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
              <DateRangePicker /> {/* Use the new DateRangePicker component */}
              <Button variant="ghost" size="icon" onClick={goToNextPeriod} className="h-9 w-9 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-lilac rounded-full flex items-center justify-center text-white font-semibold text-sm">
                JD
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {error && <ErrorMessage error={error} />}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeView === 'dashboard' && <DashboardView />}
              {activeView === 'budget' && <BudgetView />}
              {activeView === 'goals' && <GoalsView />}
              {activeView === 'transactions' && <TransactionsView />}
            </>
          )}
        </main>
      </div>

      <QuickAddTransactionModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSave={handleQuickAddTransaction}
      />

      <AddEditCategoryModal
        isOpen={isAddEditCategoryModalOpen}
        onClose={() => setIsAddEditCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
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