"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Wallet, DollarSign, Bitcoin, TrendingUp, TrendingDown, ChevronRight, LayoutDashboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { useInvestmentData, Investment } from '@/hooks/use-investment-data';
import { calculateGainLoss } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { useDateRange } from '@/context/DateRangeContext';

// Reusable components
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import OverallPortfolioSummaryCard from '@/components/investments/OverallPortfolioSummaryCard';
import InvestmentHoldingsList from '@/components/investments/InvestmentHoldingsList';
import BottomNavBar from '@/components/BottomNavBar';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AddInvestmentModal from '@/components/AddInvestmentModal';
import ProDonut from '@/components/ProDonut'; // New ProDonut chart
import RechartsTooltip from '@/components/common/RechartsTooltip'; // Reusing existing tooltip
import AllocationCard from '@/components/investments/AllocationCard'; // Import new AllocationCard
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Interfaces ---
interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
}

interface AllocationData {
  name: string;
  value: number;
  color?: string; // Optional color for ProDonut
}

interface PortfolioSnapshotData {
  date: string;
  value: number;
}

const ALLOCATION_COLORS = [
  'hsl(var(--blue))',
  'hsl(var(--emerald))',
  'hsl(var(--lilac))',
  'hsl(25 95% 53%)', // Amber
  'hsl(220 70% 50%)', // Indigo
  'hsl(340 80% 60%)', // Pink
  'hsl(175 70% 40%)', // Cyan
  'hsl(60 90% 50%)',  // Yellow
];

interface InvestmentsPageProps {
  userUid: string | null;
  setShowProfilePopup: (show: boolean) => void;
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ userUid, setShowProfilePopup }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { selectedRange } = useDateRange();

  const {
    investments,
    portfolioSnapshots,
    loading,
    error,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    priceChange,
    alertedInvestments,
  } = useInvestmentData(userUid, selectedRange.from, selectedRange.to);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [initialInvestmentType, setInitialInvestmentType] = useState<'Stock' | 'Crypto' | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'all' | 'stocks' | 'crypto'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'gainLossPercentage' | 'totalValue'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  // --- Computed Portfolio Summary (Overall) ---
  const overallPortfolioSummary: PortfolioSummary = useMemo(() => {
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

  // --- Filtered Investments for Tabs ---
  const stockInvestments = useMemo(() => investments.filter(inv => inv.type === 'Stock'), [investments]);
  const cryptoInvestments = useMemo(() => investments.filter(inv => inv.type === 'Crypto'), [investments]);

  // --- Portfolio Summary (Per Section) ---
  const getSectionSummary = useCallback((sectionInvestments: Investment[]): PortfolioSummary => {
    let totalInvested = 0;
    let currentValue = 0;
    let totalGainLoss = 0;

    sectionInvestments.forEach(inv => {
      const invested = inv.quantity * inv.buyPrice;
      const current = inv.quantity * inv.currentPrice;
      totalInvested += invested;
      currentValue += current;
      totalGainLoss += (current - invested);
    });

    const totalGainLossPercentage = totalInvested === 0 ? 0 : (totalGainLoss / totalInvested) * 100;
    return { totalInvested, currentValue, totalGainLoss, totalGainLossPercentage };
  }, []);

  const stockSummary = useMemo(() => getSectionSummary(stockInvestments), [stockInvestments, getSectionSummary]);
  const cryptoSummary = useMemo(() => getSectionSummary(cryptoInvestments), [cryptoInvestments, getSectionSummary]);

  // --- Filtered and Sorted Investments for Display ---
  const getSortedInvestments = useCallback((invList: Investment[]) => {
    let filtered = [...invList];

    return filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'gainLossPercentage') {
        valA = calculateGainLoss(a).gainLossPercentage;
        valB = calculateGainLoss(b).gainLossPercentage;
      } else if (sortBy === 'totalValue') {
        valA = a.quantity * a.currentPrice;
        valB = b.quantity * b.currentPrice;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortBy, sortOrder]);

  const sortedStockInvestments = useMemo(() => getSortedInvestments(stockInvestments), [stockInvestments, getSortedInvestments]);
  const sortedCryptoInvestments = useMemo(() => getSortedInvestments(cryptoInvestments), [cryptoInvestments, getSortedInvestments]);

  // --- Allocation Data for ProDonut ---
  const getAllocationDataForDonut = useCallback((investmentsList: Investment[], totalPortfolioValue: number): AllocationData[] => {
    const allocationMap = new Map<string, number>();
    investmentsList.forEach(inv => {
      const categoryName = inv.name; // Use asset name as category for allocation
      const value = inv.quantity * inv.currentPrice;
      allocationMap.set(categoryName, (allocationMap.get(categoryName) || 0) + value);
    });

    let data = Array.from(allocationMap.entries()).map(([name, value]) => ({ name, value }));

    // Group "Other" if more than 5 categories
    if (data.length > 5) {
      data.sort((a, b) => b.value - a.value); // Sort by value descending
      const top5 = data.slice(0, 5);
      const otherValue = data.slice(5).reduce((sum, item) => sum + item.value, 0);
      if (otherValue > 0) {
        top5.push({ name: t("common.other"), value: otherValue });
      }
      data = top5;
    }

    // Assign colors
    return data.map((item, index) => ({
      ...item,
      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
    }));
  }, [t]);

  const overallAllocationData = useMemo(() => getAllocationDataForDonut(investments, overallPortfolioSummary.currentValue), [investments, overallPortfolioSummary.currentValue, getAllocationDataForDonut]);
  const stockAllocationData = useMemo(() => getAllocationDataForDonut(stockInvestments, stockSummary.currentValue), [stockInvestments, stockSummary.currentValue, getAllocationDataForDonut]);
  const cryptoAllocationData = useMemo(() => getAllocationDataForDonut(cryptoInvestments, cryptoSummary.currentValue), [cryptoInvestments, cryptoSummary.currentValue, getAllocationDataForDonut]);

  // Portfolio Growth Chart Data
  const portfolioGrowthChartData: PortfolioSnapshotData[] = useMemo(() => {
    return portfolioSnapshots.map(snapshot => ({
      date: snapshot.date,
      value: snapshot.value,
    }));
  }, [portfolioSnapshots]);

  // --- Handlers ---
  const handleAddInvestment = useCallback((type?: 'Stock' | 'Crypto') => {
    setEditingInvestment(null);
    setInitialInvestmentType(type);
    setIsModalOpen(true);
  }, []);

  const handleEditInvestment = useCallback((investment: Investment) => {
    setEditingInvestment(investment);
    setInitialInvestmentType(investment.type); // Set initial type for editing
    setIsModalOpen(true);
  }, []);

  const handleSaveInvestment = useCallback(async (newInvestment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice' | 'change24hPercent'>) => {
    if (editingInvestment) {
      await updateInvestment(editingInvestment.id, newInvestment);
    } else {
      await addInvestment(newInvestment);
    }
    setIsModalOpen(false);
    setEditingInvestment(null);
    setInitialInvestmentType(undefined);
  }, [editingInvestment, addInvestment, updateInvestment]);

  const handleDeleteInvestment = useCallback(async (id: string) => {
    await deleteInvestment(id);
    setIsModalOpen(false);
    setEditingInvestment(null);
    setInitialInvestmentType(undefined);
  }, [deleteInvestment]);

  const handleSortByChange = useCallback((value: 'name' | 'gainLossPercentage' | 'totalValue') => {
    setSortBy(value);
  }, []);

  const handleToggleSortOrder = useCallback(() => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} onViewChange={handleViewChange} userUid={userUid} setShowProfilePopup={setShowProfilePopup} />

      <div className={`flex flex-col flex-1 min-w-0 ${sidebarOpen ? 'sm:ml-72' : 'sm:ml-0'} transition-all duration-300 ease-in-out`}>
        <Header
          title={t("navigation.investments")}
          subtitle={t("investments.trackPortfolio")}
          onSidebarToggle={handleSidebarToggle}
          setShowProfilePopup={setShowProfilePopup}
        />

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-24 sm:pb-6 w-full">
          {error && <ErrorMessage message={error} />}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Overall Portfolio Overview */}
            <OverallPortfolioSummaryCard
              currentValue={overallPortfolioSummary.currentValue}
              gainLossPercentage={overallPortfolioSummary.totalGainLossPercentage}
            />

            {/* Tabs for Stocks and Crypto */}
            <Tabs value={activeTab} onValueChange={(value: 'all' | 'stocks' | 'crypto') => setActiveTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 glassmorphic-card p-1 rounded-xl">
                <TabsTrigger value="all" className="data-[state=active]:glassmorphic-card data-[state=active]:text-foreground data-[state=active]:rounded-lg transition-all text-muted-foreground">{t("investments.allHoldings")}</TabsTrigger>
                <TabsTrigger value="stocks" className="data-[state=active]:glassmorphic-card data-[state=active]:text-foreground data-[state=active]:rounded-lg transition-all text-muted-foreground">{t("investments.stocks")}</TabsTrigger>
                <TabsTrigger value="crypto" className="data-[state=active]:glassmorphic-card data-[state=active]:text-foreground data-[state=active]:rounded-lg transition-all text-muted-foreground">{t("investments.crypto")}</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6 space-y-6">
                <AllocationCard
                  title={t("investments.overallAllocation")}
                  data={overallAllocationData}
                  emptyMessage={t("investments.noInvestmentsFound")}
                  totalPortfolioValue={overallPortfolioSummary.currentValue}
                  icon={LayoutDashboard}
                  sevenDayChange={{ value: 2.3, isPositive: true }} // Placeholder
                />
                <InvestmentHoldingsList
                  title={t("investments.allHoldings")}
                  investments={getSortedInvestments(investments)}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={handleSortByChange}
                  onToggleSortOrder={handleToggleSortOrder}
                  onEditInvestment={handleEditInvestment}
                  priceChange={priceChange}
                  onAddInvestment={() => handleAddInvestment()} // General add
                  emptyMessage={t("investments.noInvestmentsFound")}
                  emptyIcon={Wallet}
                  emptyButtonText={t("investments.addFirstInvestment")}
                  alertedInvestments={alertedInvestments}
                />
              </TabsContent>

              <TabsContent value="stocks" className="mt-6 space-y-6">
                <OverallPortfolioSummaryCard
                  currentValue={stockSummary.currentValue}
                  gainLossPercentage={stockSummary.totalGainLossPercentage}
                />
                <AllocationCard
                  title={t("investments.stockAllocation")}
                  data={stockAllocationData}
                  emptyMessage={t("investments.noStockData")}
                  totalPortfolioValue={stockSummary.currentValue}
                  icon={DollarSign}
                  sevenDayChange={{ value: -1.2, isPositive: false }} // Placeholder
                />
                <InvestmentHoldingsList
                  title={t("investments.stockHoldings")}
                  investments={sortedStockInvestments}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={handleSortByChange}
                  onToggleSortOrder={handleToggleSortOrder}
                  onEditInvestment={handleEditInvestment}
                  priceChange={priceChange}
                  onAddInvestment={() => handleAddInvestment('Stock')}
                  emptyMessage={t("investments.noStockInvestments")}
                  emptyIcon={DollarSign}
                  emptyButtonText={t("investments.addFirstStock")}
                  alertedInvestments={alertedInvestments}
                />
              </TabsContent>

              <TabsContent value="crypto" className="mt-6 space-y-6">
                <OverallPortfolioSummaryCard
                  currentValue={cryptoSummary.currentValue}
                  gainLossPercentage={cryptoSummary.totalGainLossPercentage}
                />
                <AllocationCard
                  title={t("investments.cryptoAllocation")}
                  data={cryptoAllocationData}
                  emptyMessage={t("investments.noCryptoData")}
                  totalPortfolioValue={cryptoSummary.currentValue}
                  icon={Bitcoin}
                  sevenDayChange={{ value: 5.1, isPositive: true }} // Placeholder
                />
                <InvestmentHoldingsList
                  title={t("investments.cryptoHoldings")}
                  investments={sortedCryptoInvestments}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={handleSortByChange}
                  onToggleSortOrder={handleToggleSortOrder}
                  onEditInvestment={handleEditInvestment}
                  priceChange={priceChange}
                  onAddInvestment={() => handleAddInvestment('Crypto')}
                  emptyMessage={t("investments.noCryptoInvestments")}
                  emptyIcon={Bitcoin}
                  emptyButtonText={t("investments.addFirstCrypto")}
                  alertedInvestments={alertedInvestments}
                />
              </TabsContent>
            </Tabs>

            {/* Portfolio Growth Visualization */}
            <motion.div
              className="glassmorphic-card"
              whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold tracking-tight">{t("investments.portfolioGrowth")}</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                {portfolioGrowthChartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={portfolioGrowthChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="portfolioGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--emerald))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--emerald))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '10px' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '10px' }}
                        tickFormatter={(value) => formatCurrency(Number(value))}
                      />
                      <RechartsTooltip
                        formatValue={formatCurrency}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="url(#portfolioGrowthGradient)"
                        fill="url(#portfolioGrowthGradient)"
                        strokeWidth={2}
                        name={t("investments.portfolioValue")}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold text-foreground">{t("investments.noGrowthData")}</p>
                    <p className="text-sm mt-2">{t("investments.addMoreInvestmentsGrowth")}</p>
                  </div>
                )}
              </CardContent>
            </motion.div>
          </motion.div>
        </main>

        {/* Add/Edit Investment Modal */}
        <AddInvestmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveInvestment}
          onDelete={handleDeleteInvestment}
          investmentToEdit={editingInvestment}
          initialType={initialInvestmentType} // Pass initial type
        />

        {/* Fixed Add Button for Mobile (now above BottomNavBar) */}
        <Button
          className={cn(
            "fixed bottom-20 right-4 sm:hidden rounded-xl p-3 shadow-lg z-30 animate-in fade-in zoom-in duration-300 transition-transform",
            "glassmorphic-card bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground"
          )}
          onClick={() => handleAddInvestment()} // General add for mobile
        >
          <Plus className="w-6 h-6" />
        </Button>

        <BottomNavBar />
      </div>
    </div>
  );
};

export default InvestmentsPage;