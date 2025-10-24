import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, AlertCircle, Calendar, PiggyBank, Menu, X, Plus, ArrowRight, Settings, Bell, Home, List, BarChart3, ChevronRight, Wallet, Search, Lightbulb, Zap, LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useFinanceData } from '@/hooks/use-finance-data';
import { formatCurrency } from '@/lib/utils';
import RemainingBudgetCard from '@/components/RemainingBudgetCard';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns'; // Import addDays

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
  } = useFinanceData(userUid);

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MMMM yyyy')); // Make it dynamic
  const [transactionSearchTerm, setTransactionSearchTerm] = useState<string>('');
  const [transactionFilterPeriod, setTransactionFilterPeriod] = useState<'all' | 'thisMonth'>('thisMonth');

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
  }, [totalBudgeted, totalSpent, remainingBudget, daysLeft]);

  // --- Smart Forecast Calculations ---
  const currentMonthDate = useMemo(() => new Date(), []);
  const currentMonthYearForForecast = useMemo(() => format(currentMonthDate, 'MMMM yyyy'), [currentMonthDate]);

  const filteredTransactionsForForecast = useMemo(() => {
    return transactions.filter(txn => format(new Date(txn.date), 'MMMM yyyy') === currentMonthYearForForecast);
  }, [transactions, currentMonthYearForForecast]);

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
  }, [totalBudgeted, dailyAvgSpending, daysPassedThisMonthForForecast, forecastedRemainingBalance, totalExpensesThisMonth, currentMonthDate]);

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
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
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
      <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted animate-in fade-in slide-in-from-bottom-2 duration-300">
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

  const CategoryCard: React.FC<{ category: Category }> = memo(({ category }) => {
    const percentage = (category.spent / category.budgeted) * 100;
    const health = getHealthStatus(category.spent, category.budgeted);

    return (
      <div className="p-4 sm:p-6 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          <div className="text-right ml-2 flex-shrink-0">
            <p className={`font-semibold text-sm sm:text-base ${health.color}`}>
              {formatCurrency(category.budgeted - category.spent)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{Math.round(percentage)}%</p>
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
      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
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
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
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
        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Line type="monotone" dataKey="spent" stroke="hsl(var(--primary))" strokeWidth={2} name="Spent" dot={false} />
              <Line type="monotone" dataKey="budget" stroke="hsl(var(--emerald))" strokeWidth={2} strokeDasharray="5 5" name="Budget" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
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
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="hidden sm:block bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Net Worth Growth</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={netWorthTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar dataKey="value" fill="hsl(var(--emerald))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
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

      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Recent Transactions</h3>
          <Link to="/budget-app?view=transactions" className="text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:text-primary/90 font-medium flex items-center">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {transactions.slice(0, 5).map(txn => (
            <TransactionCard key={txn.id} transaction={txn} categories={categories} />
          ))}
        </div>
      </div>
    </div>
  );

  const BudgetView: React.FC = () => (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
      <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 text-foreground card-shadow border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold">October Budget</h2>
          {budgetSettings.rolloverEnabled && (
            <div className="flex items-center space-x-1 bg-muted/50 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
              <ArrowRight className="w-3 h-3" />
              <span>Rollover ON</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-4">
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Budget</p>
            <p className="text-xl sm:text-3xl font-bold">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Spent</p>
            <p className="text-xl sm:text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Left</p>
            <p className="text-xl sm:text-2xl font-semibold">{formatCurrency(remainingBudget)}</p>
          </div>
        </div>
        {budgetSettings.rolloverEnabled && budgetSettings.previousMonthLeftover > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Previous month rollover</span>
              <span className="font-semibold text-foreground">+{formatCurrency(budgetSettings.previousMonthLeftover)}</span>
            </div>
          </div>
        )}
        <div className="bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${(totalSpent / totalBudgeted) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{formatCurrency(remainingPerDay)}/day • {daysLeft} days left</span>
          <span className="font-medium text-foreground">{Math.round((totalSpent / totalBudgeted) * 100)}% used</span>
        </div>
      </div>

      <div className="bg-card rounded-xl sm:rounded-2xl card-shadow overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Budget Categories</h3>
            <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-primary dark:bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 dark:hover:bg-primary/90 transition-colors text-sm active:bg-primary/80">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold">No categories set up yet!</p>
              <p className="text-sm mt-2">Start by adding your first budget category to track your spending.</p>
              <Button className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                Add First Category
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const GoalsView: React.FC = () => (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Savings Goals</h2>
        <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-primary dark:bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 dark:hover:bg-primary/90 transition-colors text-sm active:bg-primary/80">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Goal</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const percentage = (goal.current / goal.target) * 100;

            return (
              <div key={goal.id} className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: goal.color }} />
                  <span className="text-sm font-medium text-muted-foreground">{Math.round(percentage)}%</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">{goal.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current</span>
                    <span className="font-semibold text-foreground">{formatCurrency(goal.current)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-semibold text-foreground">{formatCurrency(goal.target)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden mt-3">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatCurrency(goal.target - goal.current)} to go
                  </p>
                </div>
                <Button className="w-full mt-4 bg-muted/50 hover:bg-muted text-foreground transition-transform hover:scale-[1.02] active:scale-98">
                  Add Funds
                </Button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-card rounded-xl sm:rounded-2xl p-6 text-center card-shadow border border-border/50">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">No savings goals set up yet!</p>
            <p className="text-sm mt-2 text-muted-foreground">Start saving for your dreams by creating a new goal.</p>
            <Button className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
              Create First Goal
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Goal Progress Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={[
            { month: 'Apr', emergency: 5200, vacation: 800, laptop: 1100 },
            { month: 'May', emergency: 5600, vacation: 900, laptop: 1300 },
            { month: 'Jun', emergency: 5900, vacation: 950, laptop: 1450 },
            { month: 'Jul', emergency: 6100, vacation: 1000, laptop: 1500 },
            { month: 'Aug', emergency: 6250, vacation: 1050, laptop: 1550 },
            { month: 'Sep', emergency: 6400, vacation: 1150, laptop: 1600 },
            { month: 'Oct', emergency: 6500, vacation: 1200, laptop: 1650 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="emergency" stroke="hsl(var(--emerald))" strokeWidth={2} name="Emergency" dot={false} />
            <Line type="monotone" dataKey="vacation" stroke="hsl(var(--blue))" strokeWidth={2} name="Vacation" dot={false} />
            <Line type="monotone" dataKey="laptop" stroke="hsl(var(--lilac))" strokeWidth={2} name="Laptop" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const TransactionsView: React.FC = () => {
    const filteredTransactions = useMemo(() => {
      const lowerCaseSearchTerm = transactionSearchTerm.toLowerCase();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return transactions.filter(txn => {
        const matchesSearch = txn.merchant.toLowerCase().includes(lowerCaseSearchTerm) ||
                              txn.category.toLowerCase().includes(lowerCaseSearchTerm);

        const transactionDate = new Date(txn.date);
        const matchesPeriod = transactionFilterPeriod === 'all' || transactionDate >= startOfMonth;

        return matchesSearch && matchesPeriod;
      });
    }, [transactions, transactionSearchTerm, transactionFilterPeriod]);

    return (
      <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Transactions</h2>
          <Button onClick={() => setIsQuickAddModalOpen(true)} className="flex items-center space-x-2 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <div className="sticky top-[64px] sm:top-[72px] bg-background z-10 py-2 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-border card-shadow">
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

        <div className="bg-card rounded-xl sm:rounded-2xl card-shadow overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50">
          <div className="divide-y divide-border">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(txn => (
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
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <List className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold text-foreground">No transactions found.</p>
                <p className="text-sm mt-2">It looks like you haven't added any transactions yet. Use the "Add Expense" button to get started!</p>
                <Button onClick={() => setIsQuickAddModalOpen(true)} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                  Add First Expense
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className={`fixed left-0 top-0 h-full bg-card/90 backdrop-blur-md border-r border-border transition-transform duration-300 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 sm:w-72 card-shadow`}>
        <div className="flex flex-col h-full">
          <div className="p-5 sm:p-6 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-lilac bg-clip-text text-transparent">
                FinanceFlow
              </h1>
              <button onClick={handleCloseSidebar} className="p-2 hover:bg-muted/50 rounded-lg active:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-lilac rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">John Doe</p>
                <p className="text-xs text-muted-foreground">john@example.com</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/budget-app?view=dashboard' },
              { id: 'transactions', label: 'Transactions', icon: List, path: '/budget-app?view=transactions' },
              { id: 'budget', label: 'Budget', icon: DollarSign, path: '/budget-app?view=budget' },
              { id: 'goals', label: 'Goals', icon: Target, path: '/budget-app?view=goals' },
              { id: 'investments', label: 'Investments', icon: Wallet, path: '/investments' },
            ].map(item => {
              const Icon = item.icon;
              const isActive = (item.path === location.pathname + location.search) || (item.id === 'investments' && location.pathname === '/investments');

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 active:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-primary dark:bg-primary rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="space-y-1">
              <Link to="/settings" className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors active:bg-muted">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors active:bg-muted">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 dark:from-primary/10 to-lilac/50 dark:to-lilac/10 rounded-xl">
              <p className="text-sm font-semibold text-foreground mb-1">💡 Pro Tip</p>
              <p className="text-xs text-muted-foreground">Review your transactions daily to stay on top of your spending!</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col min-h-screen">
        <header className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-40 safe-top card-shadow transition-colors duration-300">
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
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{selectedMonth}</span>
              </div>
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleCloseSidebar}
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
        />
      )}

      <Button
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 rounded-full p-3 sm:p-4 shadow-lg bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground z-30 animate-in fade-in zoom-in duration-300 transition-transform hover:scale-[1.05] active:scale-95"
        onClick={() => setIsQuickAddModalOpen(true)}
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
      </Button>

      <QuickAddTransactionModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSave={handleQuickAddTransaction}
      />
    </div>
  );
};

export default FinanceFlow;