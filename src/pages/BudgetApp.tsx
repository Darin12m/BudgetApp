import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, AlertCircle, Calendar, PiggyBank, Menu, X, Plus, ArrowRight, Settings, Bell, Download, Home, List, BarChart3, ChevronRight, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinanceData } from '@/hooks/use-finance-data'; // Import the new hook

// TypeScript Interfaces (moved to use-finance-data.tsx for centralized management)
// Re-declaring them here for component props/local types if needed, but primarily
// the hook will manage the data types.
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

interface BudgetSettings {
  rolloverEnabled: boolean;
  previousMonthLeftover: number;
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
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(value));
};

const getHealthStatus = (spent: number, budgeted: number): HealthStatus => {
  const percentage = (spent / budgeted) * 100;
  if (percentage >= 100) return { status: 'over', color: 'text-red-500', bg: 'bg-red-50' };
  if (percentage >= 80) return { status: 'warning', color: 'text-amber-500', bg: 'bg-amber-50' };
  return { status: 'good', color: 'text-green-500', bg: 'bg-green-50' };
};

interface BudgetAppProps {
  userUid: string | null;
}

const FinanceFlow: React.FC<BudgetAppProps> = ({ userUid }) => {
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
  const [selectedMonth, setSelectedMonth] = useState<string>('October 2025'); // This would ideally be dynamic based on current date

  // Calculate total recurring expenses
  const totalRecurring = useMemo(() => 
    recurringTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0), 
    [recurringTransactions]
  );

  // Calculate net worth
  const netWorth = useMemo(() => 
    accounts.reduce((sum, acc) => sum + acc.balance, 0), 
    [accounts]
  );

  // Monthly spending trend data (mocked for now, would be derived from transactions)
  const spendingTrend: ChartData[] = useMemo(() => [
    { month: 'Apr', spent: 2800, budget: 3000 },
    { month: 'May', spent: 2950, budget: 3000 },
    { month: 'Jun', spent: 2650, budget: 3000 },
    { month: 'Jul', spent: 3100, budget: 3200 },
    { month: 'Aug', spent: 2900, budget: 3200 },
    { month: 'Sep', spent: 2750, budget: 3000 },
    { month: 'Oct', spent: 1257.59, budget: 3000 }, // This should be calculated from actual transactions
  ], []);

  // Net worth trend (mocked for now, would be derived from accounts history)
  const netWorthTrend: NetWorthData[] = useMemo(() => [
    { month: 'Apr', value: 35000 },
    { month: 'May', value: 36200 },
    { month: 'Jun', value: 37100 },
    { month: 'Jul', value: 37800 },
    { month: 'Aug', value: 38500 },
    { month: 'Sep', value: 38900 },
    { month: 'Oct', value: 39202.78 }, // This should be calculated from actual accounts
  ], []);

  const totalBudgeted = useMemo(() => 
    categories.reduce((sum, cat) => sum + cat.budgeted, 0), 
    [categories]
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

  // Calculate remaining per day (days left in October)
  const today = new Date(); // Use current date
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
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

  // Event handlers with useCallback
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

  // Loading and Error Components
  const LoadingSpinner: React.FC = memo(() => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  ));

  const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = memo(({ error, onRetry }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  ));

  // Smaller Components
  const StatsCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    trend?: { value: string; color: string };
  }> = memo(({ title, value, subtitle, icon: Icon, color, bgColor, trend }) => (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-600 mt-1 truncate">{subtitle}</p>}
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
        <div className="text-xs text-gray-500 flex items-center mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Auto-updated {accounts.length > 0 ? accounts[0].lastUpdated : 'N/A'}
        </div>
      )}
    </div>
  ));

  const TransactionCard: React.FC<{ transaction: Transaction; categories: Category[] }> = memo(({ transaction, categories }) => {
    const category = categories.find(c => c.name === transaction.category);
    return (
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors active:bg-gray-100">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            transaction.amount > 0 ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <span className="text-lg">{transaction.amount > 0 ? '💰' : category?.emoji || '💳'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{transaction.merchant}</p>
            <p className="text-xs text-gray-500 truncate">{transaction.category}</p>
          </div>
        </div>
        <div className="text-right ml-2 flex-shrink-0">
          <p className={`font-semibold text-sm ${transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
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
      <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors active:bg-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{category.emoji}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{category.name}</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                {formatCurrency(category.spent)} of {formatCurrency(category.budgeted)}
              </p>
            </div>
          </div>
          <div className="text-right ml-2 flex-shrink-0">
            <p className={`font-semibold text-sm sm:text-base ${health.color}`}>
              {formatCurrency(category.budgeted - category.spent)}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">{Math.round(percentage)}%</p>
          </div>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
      {/* Mobile Hero Card */}
      <div className="sm:hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm text-blue-100 mb-1">Total Net Worth</p>
        <p className="text-4xl font-bold mb-2">{formatCurrency(netWorth)}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">+3.2% this month</span>
          </div>
          <div className="text-xs text-blue-100">
            Updated {accounts.length > 0 ? accounts[0].lastUpdated : 'N/A'}
          </div>
        </div>
      </div>

      {/* Remaining Per Day Card - Mobile Priority */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-green-100 mb-1">Safe to Spend Per Day</p>
            <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(remainingPerDay)}</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Calendar className="w-7 h-7" />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-100">{daysLeft} days left in October</span>
          <span className="font-semibold">{formatCurrency(remainingBudget)} remaining</span>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Net Worth"
          value={formatCurrency(netWorth)}
          icon={TrendingUp}
          color="#10b981"
          bgColor="#dcfce7"
          trend={{ value: "+3.2%", color: "text-green-600" }}
        />
        <StatsCard
          title="Spent"
          value={formatCurrency(totalSpent)}
          subtitle={`of ${formatCurrency(totalBudgeted)}`}
          icon={DollarSign}
          color="#3b82f6"
          bgColor="#dbeafe"
        />
        <StatsCard
          title="Remaining"
          value={formatCurrency(remainingBudget)}
          subtitle={`${Math.round((remainingBudget / totalBudgeted) * 100)}%`}
          icon={PiggyBank}
          color="#10b981"
          bgColor="#dcfce7"
        />
        <StatsCard
          title="Accounts"
          value={accounts.length.toString()}
          subtitle="Connected"
          icon={CreditCard}
          color="#8b5cf6"
          bgColor="#f3e8ff"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Spending vs Budget */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Line type="monotone" dataKey="spent" stroke="#3b82f6" strokeWidth={2} name="Spent" dot={false} />
              <Line type="monotone" dataKey="budget" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Budget" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
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

      {/* Net Worth Growth - Hidden on mobile by default */}
      <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Net Worth Growth</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={netWorthTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recurring Transactions Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Recurring Bills</h3>
            <p className="text-sm text-gray-500 mt-1">Total: {formatCurrency(totalRecurring)}/month</p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
            Manage
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {recurringTransactions.slice(0, 5).map(txn => (
            <div key={txn.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors active:bg-gray-100">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{txn.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{txn.name}</p>
                  <p className="text-xs text-gray-500">{txn.frequency} • Due {txn.nextDate}</p>
                </div>
              </div>
              <div className="text-right ml-2 flex-shrink-0">
                <p className="font-semibold text-sm text-gray-900">{formatCurrency(txn.amount)}</p>
                <span className="text-xs text-purple-600 font-medium">Auto-pay</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
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
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
      {/* Mobile-optimized header card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold">October Budget</h2>
          {budgetSettings.rolloverEnabled && (
            <div className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
              <ArrowRight className="w-3 h-3" />
              <span>Rollover ON</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-4">
          <div>
            <p className="text-blue-100 text-xs sm:text-sm">Budget</p>
            <p className="text-xl sm:text-3xl font-bold">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs sm:text-sm">Spent</p>
            <p className="text-xl sm:text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs sm:text-sm">Left</p>
            <p className="text-xl sm:text-2xl font-semibold">{formatCurrency(remainingBudget)}</p>
          </div>
        </div>
        {budgetSettings.rolloverEnabled && budgetSettings.previousMonthLeftover > 0 && (
          <div className="bg-white/10 rounded-lg p-3 mb-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-100">Previous month rollover</span>
              <span className="font-semibold">+{formatCurrency(budgetSettings.previousMonthLeftover)}</span>
            </div>
          </div>
        )}
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${(totalSpent / totalBudgeted) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-blue-100">{formatCurrency(remainingPerDay)}/day • {daysLeft} days left</span>
          <span className="font-medium">{Math.round((totalSpent / totalBudgeted) * 100)}% used</span>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Budget Categories</h3>
            <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm active:bg-blue-800">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </div>
  );

  const GoalsView: React.FC = () => (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Savings Goals</h2>
        <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm active:bg-blue-800">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Goal</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const percentage = (goal.current / goal.target) * 100;
          
          return (
            <div key={goal.id} className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: goal.color }} />
                <span className="text-sm font-medium text-gray-600">{Math.round(percentage)}%</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">{goal.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(goal.current)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Target</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(goal.target)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-3">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: goal.color
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {formatCurrency(goal.target - goal.current)} to go
                </p>
              </div>
              <button className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm active:bg-gray-100">
                Add Funds
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile-optimized chart */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Goal Progress Over Time</h3>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="emergency" stroke="#10b981" strokeWidth={2} name="Emergency" dot={false} />
            <Line type="monotone" dataKey="vacation" stroke="#f59e0b" strokeWidth={2} name="Vacation" dot={false} />
            <Line type="monotone" dataKey="laptop" stroke="#3b82f6" strokeWidth={2} name="Laptop" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const TransactionsView: React.FC = () => (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Transactions</h2>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm active:bg-gray-100">
            Filter
          </button>
          <button className="hidden sm:flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Mobile-optimized transaction list */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="sm:hidden divide-y divide-gray-100">
          {transactions.map(txn => (
            <div key={txn.id} className="p-4 active:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {txn.amount > 0 ? '💰' : categories.find(c => c.name === txn.category)?.emoji || '💳'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{txn.merchant}</p>
                    <p className="text-xs text-gray-500">{txn.category}</p>
                  </div>
                </div>
                <p className={`font-bold text-sm ml-2 flex-shrink-0 ${txn.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{txn.date}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  txn.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                }`}>
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map(txn => (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{categories.find(c => c.name === txn.category)?.emoji || '💳'}</span>
                      <span className="text-sm font-medium text-gray-900">{txn.merchant}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.account}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      txn.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-semibold ${txn.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* iOS-style Sidebar - slides from left */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-transform duration-300 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 sm:w-72`}>
        <div className="flex flex-col h-full">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FinanceFlow
              </h1>
              <button onClick={handleCloseSidebar} className="p-2 hover:bg-gray-100 rounded-lg active:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">John Doe</p>
                <p className="text-xs text-gray-500">john@example.com</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/budget-app' },
              { id: 'transactions', label: 'Transactions', icon: List, path: '/budget-app' },
              { id: 'budget', label: 'Budget', icon: DollarSign, path: '/budget-app' },
              { id: 'goals', label: 'Goals', icon: Target, path: '/budget-app' },
              { id: 'investments', label: 'Investments', icon: Wallet, path: '/investments' },
            ].map(item => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.path && (item.id === 'investments' || activeView === item.id);
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-100">
            <div className="space-y-1">
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors active:bg-gray-100">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors active:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              <p className="text-sm font-semibold text-gray-900 mb-1">💡 Pro Tip</p>
              <p className="text-xs text-gray-600">Review your transactions daily to stay on top of your spending!</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col min-h-screen">
        {/* iOS-style Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-top">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <button 
                onClick={handleSidebarToggle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200 flex-shrink-0"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 capitalize truncate">{activeView}</h2>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Welcome back! Here's your financial overview.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{selectedMonth}</span>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Content Area with proper safe areas */}
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

        {/* iOS-style Bottom Navigation - Fixed at bottom on mobile */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            {[
              { id: 'dashboard', label: 'Home', icon: Home, path: '/budget-app' },
              { id: 'transactions', label: 'Activity', icon: List, path: '/budget-app' },
              { id: 'budget', label: 'Budget', icon: DollarSign, path: '/budget-app' },
              { id: 'goals', label: 'Goals', icon: Target, path: '/budget-app' },
              { id: 'investments', label: 'Investments', icon: Wallet, path: '/investments' },
            ].map(item => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.path && (item.id === 'investments' || activeView === item.id);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => handleViewChange(item.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all active:scale-95 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
                  <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 w-8 h-1 bg-blue-600 rounded-t-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Desktop Footer - Hidden on mobile */}
        <footer className="hidden sm:block mt-12 px-6 py-8 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  FinanceFlow
                </h3>
                <p className="text-sm text-gray-600">
                  Smart budgeting that adapts to your lifestyle. Take control of your finances with ease.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Automatic categorization</li>
                  <li>Budget tracking</li>
                  <li>Goal setting</li>
                  <li>Analytics & insights</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Security</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>🔒 Bank-level encryption</li>
                  <li>🛡️ No ads or data selling</li>
                  <li>✅ SOC 2 compliant</li>
                  <li>🔐 Two-factor auth</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Help Center</li>
                  <li>Live Chat</li>
                  <li>Video Tutorials</li>
                  <li>Community Forum</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-gray-500">© 2025 FinanceFlow. Built with insights from leading budgeting apps.</p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Privacy</a>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Terms</a>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* iOS-style overlay with blur effect */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleCloseSidebar}
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
        />
      )}
    </div>
  );
};

export default FinanceFlow;