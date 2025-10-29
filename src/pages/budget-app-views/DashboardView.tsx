"use client";

import React, { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, DollarSign, CreditCard, PiggyBank, Lightbulb, LucideIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Account, RecurringTransaction, Transaction, Category } from '@/hooks/use-finance-data';
import { formatDate } from '@/lib/utils';
import RemainingBudgetCard from '@/components/RemainingBudgetCard';
import StatsCard from '@/components/dashboard/StatsCard';
import CategoryOverviewCard from '@/components/dashboard/CategoryOverviewCard';
import RechartsTooltip from '@/components/common/RechartsTooltip';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface ChartData {
  month: string;
  spent: number;
  budget: number;
}

interface NetWorthData {
  month: string;
  value: number;
}

interface DashboardViewProps {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  remainingPerDay: number;
  daysLeft: number;
  budgetSettings: any;
  smartSummary: string;
  runOutIcon: LucideIcon;
  runOutColor: string;
  runOutMessage: string;
  dailyAvgSpending: number;
  spendingForecastChartData: { day: number; actual?: number; forecast?: number }[];
  netWorth: number;
  accounts: Account[];
  spendingTrend: ChartData[];
  categoryData: { name: string; value: number; color: string; }[];
  recurringTransactions: RecurringTransaction[];
  transactions: Transaction[];
  categories: Category[];
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
  netWorthTrend: NetWorthData[];
}

const DashboardView: React.FC<DashboardViewProps> = memo(({
  totalBudgeted,
  totalSpent,
  remainingBudget,
  remainingPerDay,
  daysLeft,
  budgetSettings,
  smartSummary,
  runOutIcon: RunOutIcon,
  runOutColor,
  runOutMessage,
  dailyAvgSpending,
  spendingForecastChartData,
  netWorth,
  accounts,
  spendingTrend,
  categoryData,
  recurringTransactions,
  transactions,
  categories,
  formatCurrency,
  netWorthTrend,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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

        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
          <div className="flex items-center space-x-3 mb-3">
            {RunOutIcon && <RunOutIcon className={`w-5 h-5 ${runOutColor}`} />}
            <h3 className={`text-base sm:text-lg font-semibold ${runOutColor}`}>{t("dashboard.smartForecast")}</h3>
          </div>
          <p className={`text-sm sm:text-base ${runOutColor} mb-4`}>{runOutMessage}</p>

          {totalBudgeted > 0 && dailyAvgSpending > 0 && spendingForecastChartData.length > 1 ? (
            <>
              <h4 className="text-sm font-semibold text-foreground mb-2">{t("dashboard.spendingTrajectory")}</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={spendingForecastChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickFormatter={(value) => formatCurrency(Number(value))} />
                  <RechartsTooltip formatValue={formatCurrency} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} name={t("dashboard.actualSpent")} dot={false} />
                  <Line type="monotone" dataKey="forecast" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" name={t("dashboard.forecastedSpent")} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">{t("dashboard.noForecastYet")}</p>
              <p className="text-sm mt-2">{t("dashboard.addTransactionsAndBudget")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title={t("dashboard.netWorth")}
          value={formatCurrency(netWorth)}
          icon={TrendingUp}
          color="hsl(var(--emerald))"
          bgColor="hsl(var(--emerald)/10%)"
          trend={{ value: "+3.2%", color: "text-emerald" }}
          accounts={accounts}
        />
        <StatsCard
          title={t("dashboard.spent")}
          value={formatCurrency(totalSpent)}
          subtitle={t("dashboard.ofBudget", { budget: formatCurrency(totalBudgeted) })}
          icon={DollarSign}
          color="hsl(var(--primary))"
          bgColor="hsl(var(--primary)/10%)"
          accounts={accounts}
        />
        <StatsCard
          title={t("dashboard.remaining")}
          value={formatCurrency(remainingBudget)}
          subtitle={`${totalBudgeted > 0 ? Math.round((remainingBudget / totalBudgeted) * 100) : 0}%`}
          icon={PiggyBank}
          color="hsl(var(--emerald))"
          bgColor="hsl(var(--emerald)/10%)"
          accounts={accounts}
        />
        <StatsCard
          title={t("dashboard.accounts")}
          value={accounts.length.toString()}
          subtitle={t("dashboard.connected")}
          icon={CreditCard}
          color="hsl(var(--lilac))"
          bgColor="hsl(var(--lilac)/10%)"
          accounts={accounts}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t("dashboard.spendingTrend")}</h3>
          {spendingTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={spendingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickFormatter={(value) => formatCurrency(Number(value))} />
                <RechartsTooltip formatValue={formatCurrency} />
                <Line type="monotone" dataKey="spent" stroke="hsl(var(--primary))" strokeWidth={2} name={t("dashboard.spent")} dot={false} />
                <Line type="monotone" dataKey="budget" stroke="hsl(var(--emerald))" strokeWidth={2} strokeDasharray="5 5" name={t("dashboard.budget")} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">{t("dashboard.noSpendingTrend")}</p>
              <p className="text-sm mt-2">{t("dashboard.addMoreTransactions")}</p>
            </div>
          )}
        </div>

        <CategoryOverviewCard
          categories={categories}
          totalBudgetedMonthly={totalBudgeted}
          totalSpentMonthly={totalSpent}
        />
      </div>

      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t("dashboard.netWorthGrowth")}</h3>
        {netWorthTrend.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={netWorthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickFormatter={(value) => formatCurrency(Number(value))} />
              <RechartsTooltip formatValue={formatCurrency} />
              <Bar dataKey="value" fill="hsl(var(--emerald))" radius={[8, 8, 0, 0]} name={t("dashboard.netWorth")} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">{t("dashboard.noNetWorthGrowth")}</p>
            <p className="text-sm mt-2">{t("dashboard.addAccountsAndTransactions")}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">{t("dashboard.upcomingRecurringBills")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("dashboard.total")}: {formatCurrency(recurringTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0))}/{t("transactions.month")}</p>
            </div>
            <Link to="/budget-app?view=recurring" className="text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:bg-primary/90 font-medium flex items-center">
              {t("dashboard.manage")}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {recurringTransactions.length > 0 ? (
              recurringTransactions.slice(0, 5).map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-lilac/10 rounded-full flex items-center justify-center flex-shrink-0 text-lilac">
                      <span className="text-lg">{txn.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{txn.name}</p>
                      <p className="text-xs text-muted-foreground">{txn.frequency} • {t("goals.due")} {txn.nextDate}</p>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-semibold text-sm text-foreground">{formatCurrency(txn.amount)}</p>
                    <span className="text-xs text-lilac font-medium">{t("transactions.autoPay")}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold text-foreground">{t("dashboard.noRecurringBills")}</p>
                <p className="text-sm mt-2">{t("dashboard.addRegularExpenses")}</p>
                <Link to="/budget-app?view=recurring">
                  <Button className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                    {t("dashboard.addRecurringBill")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t("dashboard.recentTransactions")}</h3>
            <Link to="/budget-app?view=transactions" className="text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:bg-primary/90 font-medium flex items-center">
              {t("common.viewAll")}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map(txn => (
                <div key={txn.id} className="p-4 active:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="2xl flex-shrink-0">
                        {txn.amount > 0 ? '💰' : categories.find(c => c.id === txn.categoryId)?.emoji || '💳'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{txn.merchant}</p>
                        <p className="text-xs text-muted-foreground">{categories.find(c => c.id === txn.categoryId)?.name || t("common.uncategorized")}</p>
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
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold text-foreground">{t("dashboard.noRecentTransactions")}</p>
                <p className="text-sm mt-2">{t("dashboard.addFirstTransaction")}</p>
                <Link to="/budget-app?view=transactions">
                  <Button className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                    {t("dashboard.addTransaction")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default DashboardView;