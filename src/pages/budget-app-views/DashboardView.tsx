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
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card
import { cn } from '@/lib/utils';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6 pb-24 sm:pb-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-2"> {/* Responsive grid */}
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

        <Card className="glassmorphic-card p-4 sm:p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"> {/* Applied consistent card style and padding */}
          <motion.div
            whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center space-x-3 mb-3">
              {RunOutIcon && <RunOutIcon className={`w-5 h-5 flex-shrink-0 ${runOutColor}`} />}
              <h3 className={`text-base sm:text-lg font-semibold ${runOutColor} tracking-tight truncate`}>{t("dashboard.smartForecast")}</h3> {/* Applied consistent typography and truncate */}
            </div>
            <p className={`text-sm sm:text-base ${runOutColor} mb-4 break-words text-balance`}>{runOutMessage}</p> {/* Applied consistent typography and text wrapping */}

            {totalBudgeted > 0 && dailyAvgSpending > 0 && spendingForecastChartData.length > 1 ? (
              <>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2 tracking-tight">{t("dashboard.spendingTrajectory")}</h4> {/* Applied consistent typography */}
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
                <p className="text-base sm:text-lg font-semibold text-foreground break-words text-balance">{t("dashboard.noForecastYet")}</p> {/* Applied consistent typography and text wrapping */}
                <p className="text-xs sm:text-sm mt-2 break-words text-balance">{t("dashboard.addTransactionsAndBudget")}</p> {/* Applied consistent typography and text wrapping */}
              </div>
            )}
          </motion.div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"> {/* Responsive grid */}
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

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-2"> {/* Responsive grid */}
        <Card className="glassmorphic-card p-4 sm:p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"> {/* Applied consistent card style and padding */}
          <motion.div
            whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 tracking-tight">{t("dashboard.spendingTrend")}</h3> {/* Applied consistent typography */}
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
                <p className="text-base sm:text-lg font-semibold text-foreground break-words text-balance">{t("dashboard.noSpendingTrend")}</p> {/* Applied consistent typography and text wrapping */}
                <p className="text-xs sm:text-sm mt-2 break-words text-balance">{t("dashboard.addMoreTransactions")}</p> {/* Applied consistent typography and text wrapping */}
              </div>
            )}
          </motion.div>
        </Card>

        <CategoryOverviewCard
          categories={categories}
          totalBudgetedMonthly={totalBudgeted}
          totalSpentMonthly={totalSpent}
        />
      </div>

      <Card className="glassmorphic-card p-4 sm:p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"> {/* Applied consistent card style and padding */}
        <motion.div
          whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 tracking-tight">{t("dashboard.netWorthGrowth")}</h3> {/* Applied consistent typography */}
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
              <p className="text-base sm:text-lg font-semibold text-foreground break-words text-balance">{t("dashboard.noNetWorthGrowth")}</p> {/* Applied consistent typography and text wrapping */}
              <p className="text-xs sm:text-sm mt-2 break-words text-balance">{t("dashboard.addAccountsAndTransactions")}</p> {/* Applied consistent typography and text wrapping */}
            </div>
          )}
        </motion.div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-2"> {/* Responsive grid */}
        <Card className="glassmorphic-card p-4 sm:p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"> {/* Applied consistent card style and padding */}
          <motion.div
            whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0"> {/* Added min-w-0 */}
                <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight truncate">{t("dashboard.upcomingRecurringBills")}</h3> {/* Applied consistent typography and truncate */}
                <p className="text-xs sm:text-sm mt-1 text-muted-foreground truncate">{t("dashboard.total")}: {formatCurrency(recurringTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0))}/{t("transactions.month")}</p> {/* Applied consistent typography and truncate */}
              </div>
              <Link to="/budget-app?view=recurring" className="text-xs sm:text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:bg-primary/90 font-medium flex items-center flex-shrink-0"> {/* Applied consistent typography */}
                {t("dashboard.manage")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3 divide-y divide-border/10"> {/* Applied consistent divider */}
              {recurringTransactions.length > 0 ? (
                recurringTransactions.slice(0, 5).map(txn => (
                  <motion.div
                    key={txn.id}
                    whileHover={{ scale: 1.01, backgroundColor: "hsl(var(--muted)/20%)" }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center justify-between py-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-lilac/10 rounded-full flex items-center justify-center flex-shrink-0 text-lilac">
                        <span className="text-lg">{txn.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{txn.name}</p> {/* Applied consistent typography and truncate */}
                        <p className="text-xs text-muted-foreground truncate">{txn.frequency} • {t("goals.due")} {txn.nextDate}</p> {/* Applied consistent typography and truncate */}
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-semibold text-sm text-foreground font-mono">{formatCurrency(txn.amount)}</p> {/* Applied consistent typography */}
                      <span className="text-xs text-lilac font-medium">{t("transactions.autoPay")}</span> {/* Applied consistent typography */}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-base sm:text-lg font-semibold text-foreground break-words text-balance">{t("dashboard.noRecurringBills")}</p> {/* Applied consistent typography and text wrapping */}
                  <p className="text-xs sm:text-sm mt-2 break-words text-balance">{t("dashboard.addRegularExpenses")}</p> {/* Applied consistent typography and text wrapping */}
                  <Link to="/budget-app?view=recurring">
                    <Button className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                      {t("dashboard.addRecurringBill")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </Card>

        <Card className="glassmorphic-card p-4 sm:p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"> {/* Applied consistent card style and padding */}
          <motion.div
            whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight truncate">{t("dashboard.recentTransactions")}</h3> {/* Applied consistent typography and truncate */}
              <Link to="/budget-app?view=transactions" className="text-xs sm:text-sm text-primary dark:text-primary hover:text-primary/90 dark:hover:bg-primary/90 font-medium flex items-center flex-shrink-0"> {/* Applied consistent typography */}
                {t("common.viewAll")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3 divide-y divide-border/10"> {/* Applied consistent divider */}
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map(txn => (
                  <motion.div
                    key={txn.id}
                    whileHover={{ scale: 1.01, backgroundColor: "hsl(var(--muted)/20%)" }}
                    whileTap={{ scale: 0.99 }}
                    className="py-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">
                          {txn.amount > 0 ? '💰' : categories.find(c => c.id === txn.categoryId)?.emoji || '💳'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{txn.merchant}</p> {/* Applied consistent typography and truncate */}
                          <p className="text-xs text-muted-foreground truncate">{categories.find(c => c.id === txn.categoryId)?.name || t("common.uncategorized")}</p> {/* Applied consistent typography and truncate */}
                        </div>
                      </div>
                      <p className={`font-bold text-sm ml-2 flex-shrink-0 font-mono ${txn.amount > 0 ? 'text-emerald' : 'text-foreground'}`}> {/* Applied consistent typography */}
                        {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground"> {/* Applied consistent typography */}
                      <span className="truncate">{txn.date}</span> {/* Added truncate */}
                      <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        txn.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-base sm:text-lg font-semibold text-foreground break-words text-balance">{t("dashboard.noRecentTransactions")}</p> {/* Applied consistent typography and text wrapping */}
                  <p className="text-xs sm:text-sm mt-2 break-words text-balance">{t("dashboard.addFirstTransaction")}</p> {/* Applied consistent typography and text wrapping */}
                  <Link to="/budget-app?view=transactions">
                    <Button className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                      {t("dashboard.addTransaction")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </Card>
      </div>
    </motion.div>
  );
};

export default InvestmentsPage;