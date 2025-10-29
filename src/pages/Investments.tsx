"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Wallet, DollarSign, Bitcoin, TrendingUp, TrendingDown } from 'lucide-react';
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

// New modular components
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import OverallPortfolioSummaryCard from '@/components/investments/OverallPortfolioSummaryCard';
import InvestmentAllocationChart from '@/components/investments/InvestmentAllocationChart';
import InvestmentHoldingsList from '@/components/investments/InvestmentHoldingsList';
import BottomNavBar from '@/components/BottomNavBar';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header'; // Import Header
import AddInvestmentModal from '@/components/AddInvestmentModal';
import EnhancedPortfolioAllocationChart from '@/components/investments/EnhancedPortfolioAllocationChart';
import { useTranslation } from 'react-i18next';

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
  color: string;
}

interface PortfolioSnapshotData {
  date: string;
  value: number;
}

const ALLOCATION_COLORS = ['hsl(var(--blue))', 'hsl(var(--emerald))', 'hsl(var(--lilac))', '#f59e0b', '#ef4444', '#06b6d4'];

interface InvestmentsPageProps {
  userUid: string | null;
  setShowProfilePopup: (show: boolean) => void; // New prop
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ userUid, setShowProfilePopup }) => {
  const { t } = useTranslation();
  const { formatCurrency, selectedCurrency } = useCurrency();
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

  // --- Chart Data ---
  const overallAllocationData: AllocationData[] = useMemo(() => {
    const stockValue = stockInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const cryptoValue = cryptoInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);

    const data = [];
    if (stockValue > 0) data.push({ name: t("investments.stocks"), value: stockValue, color: ALLOCATION_COLORS[0] });
    if (cryptoValue > 0) data.push({ name: t("investments.crypto"), value: cryptoValue, color: ALLOCATION_COLORS[1] });
    return data;
  }, [stockInvestments, cryptoInvestments, t]);

  const stockAllocationData: AllocationData[] = useMemo(() => {
    return stockInvestments.map((inv, index) => ({
      name: inv.name,
      value: inv.quantity * inv.currentPrice,
      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
    })).filter(item => item.value > 0);
  }, [stockInvestments]);

  const cryptoAllocationData: AllocationData[] = useMemo(() => {
    return cryptoInvestments.map((inv, index) => ({
      name: inv.name,
      value: inv.quantity * inv.currentPrice,
      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
    })).filter(item => item.value > 0);
  }, [cryptoInvestments]);

  // Portfolio Growth Chart Data
  const portfolioGrowthChartData: PortfolioSnapshotData[] = useMemo(() => {
    return portfolioSnapshots.map(snapshot => ({
      date: snapshot.date,
      value: snapshot.value,
    }));
  }, [portfolioSnapshots]);

  // --- Handlers ---
  const handleAddInvestment = useCallback(() => {
    setEditingInvestment(null);
    setIsModalOpen(true);
  }, []);

  const handleEditInvestment = useCallback((investment: Investment) => {
    setEditingInvestment(investment);
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
  }, [editingInvestment, addInvestment, updateInvestment]);

  const handleDeleteInvestment = useCallback(async (id: string) => {
    await deleteInvestment(id);
    setIsModalOpen(false);
    setEditingInvestment(null);
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

          {/* Overall Portfolio Overview */}
          <OverallPortfolioSummaryCard
            currentValue={overallPortfolioSummary.currentValue}
            gainLossPercentage={overallPortfolioSummary.totalGainLossPercentage}
          />

          {/* Tabs for Stocks and Crypto */}
          <Tabs value={activeTab} onValueChange={(value: 'all' | 'stocks' | 'crypto') => setActiveTab(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card rounded-xl p-1 card-shadow backdrop-blur-lg">
              <TabsTrigger value="all" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">{t("investments.allHoldings")}</TabsTrigger>
              <TabsTrigger value="stocks" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">{t("investments.stocks")}</TabsTrigger>
              <TabsTrigger value="crypto" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">{t("investments.crypto")}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6 space-y-6">
              <EnhancedPortfolioAllocationChart
                title={t("investments.overallAllocation")}
                data={overallAllocationData}
                emptyMessage={t("investments.noInvestmentsFound")}
                totalPortfolioValue={overallPortfolioSummary.currentValue}
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
                onAddInvestment={handleAddInvestment}
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
              <InvestmentAllocationChart
                title={t("investments.stockAllocation")}
                data={stockAllocationData}
                emptyMessage={t("investments.noStockData")}
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
                onAddInvestment={handleAddInvestment}
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
              <InvestmentAllocationChart
                title={t("investments.cryptoAllocation")}
                data={cryptoAllocationData}
                emptyMessage={t("investments.noCryptoData")}
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
                onAddInvestment={handleAddInvestment}
                emptyMessage={t("investments.noCryptoInvestments")}
                emptyIcon={Bitcoin}
                emptyButtonText={t("investments.addFirstCrypto")}
                alertedInvestments={alertedInvestments}
              />
            </TabsContent>
          </Tabs>

          {/* Portfolio Growth Visualization */}
          <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{t("investments.portfolioGrowth")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              {portfolioGrowthChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={portfolioGrowthChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--tooltip-text-color))' }}
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--emerald))" strokeWidth={2} name={t("investments.portfolioValue")} dot={false} />
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
          </Card>
        </main>

        {/* Add/Edit Investment Modal */}
        <AddInvestmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveInvestment}
          onDelete={handleDeleteInvestment}
          investmentToEdit={editingInvestment}
        />

        {/* Fixed Add Button for Mobile (now above BottomNavBar) */}
        <Button
          className="fixed bottom-20 right-4 sm:hidden rounded-full p-3 shadow-lg bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground z-30 animate-in fade-in zoom-in duration-300 transition-transform hover:scale-[1.05] active:scale-95"
          onClick={handleAddInvestment}
        >
          <Plus className="w-6 h-6" />
        </Button>

        <BottomNavBar />
      </div>
    </div>
  );
};

export default InvestmentsPage;