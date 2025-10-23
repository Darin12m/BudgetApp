"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Wallet, DollarSign, Bitcoin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card"; // Import Card component

import { useInvestmentData, Investment } from '@/hooks/use-investment-data';
import { calculateGainLoss } from '@/lib/utils';

// New modular components
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import OverallPortfolioSummaryCard from '@/components/investments/OverallPortfolioSummaryCard';
import InvestmentAllocationChart from '@/components/investments/InvestmentAllocationChart';
import InvestmentHoldingsList from '@/components/investments/InvestmentHoldingsList';
import InvestmentForm from '@/components/investments/InvestmentForm'; // Centralized form

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

const ALLOCATION_COLORS = ['hsl(var(--blue))', 'hsl(var(--emerald))', 'hsl(var(--lilac))', '#f59e0b', '#ef4444', '#06b6d4'];

interface InvestmentsPageProps {
  userUid: string | null;
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ userUid }) => {
  const {
    investments,
    loading,
    error,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    priceChange,
  } = useInvestmentData(userUid);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'stocks' | 'crypto'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'gainLossPercentage' | 'totalValue'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
    let filtered = [...invList]; // Create a shallow copy to avoid direct mutation

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
    if (stockValue > 0) data.push({ name: 'Stocks', value: stockValue, color: ALLOCATION_COLORS[0] });
    if (cryptoValue > 0) data.push({ name: 'Crypto', value: cryptoValue, color: ALLOCATION_COLORS[1] });
    return data;
  }, [stockInvestments, cryptoInvestments]);

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

  // --- Handlers ---
  const handleAddInvestment = useCallback(() => {
    setEditingInvestment(null);
    setIsModalOpen(true);
  }, []);

  const handleEditInvestment = useCallback((investment: Investment) => {
    setEditingInvestment(investment);
    setIsModalOpen(true);
  }, []);

  const handleSaveInvestment = useCallback(async (newInvestment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-6">
        {error && <ErrorMessage message={error} />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Investments</h1>
          <Button onClick={handleAddInvestment} className="flex items-center space-x-2 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Investment</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Overall Portfolio Overview */}
        <OverallPortfolioSummaryCard
          currentValue={overallPortfolioSummary.currentValue}
          gainLossPercentage={overallPortfolioSummary.totalGainLossPercentage}
        />

        {/* Tabs for Stocks and Crypto */}
        <Tabs value={activeTab} onValueChange={(value: 'all' | 'stocks' | 'crypto') => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-xl p-1 card-shadow">
            <TabsTrigger value="all" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">All Holdings</TabsTrigger>
            <TabsTrigger value="stocks" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">Stocks</TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            <InvestmentAllocationChart
              title="Overall Allocation"
              data={overallAllocationData}
              emptyMessage="No data to display."
            />
            <InvestmentHoldingsList
              title="All Holdings"
              investments={getSortedInvestments(investments)}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={handleSortByChange}
              onToggleSortOrder={handleToggleSortOrder}
              onEditInvestment={handleEditInvestment}
              priceChange={priceChange}
              onAddInvestment={handleAddInvestment}
              emptyMessage="No investments found."
              emptyIcon={Wallet}
              emptyButtonText="Add First Investment"
            />
          </TabsContent>

          <TabsContent value="stocks" className="mt-6 space-y-6">
            <OverallPortfolioSummaryCard
              currentValue={stockSummary.currentValue}
              gainLossPercentage={stockSummary.totalGainLossPercentage}
            />
            <InvestmentAllocationChart
              title="Stock Allocation"
              data={stockAllocationData}
              emptyMessage="No stock data to display."
            />
            <InvestmentHoldingsList
              title="Stock Holdings"
              investments={sortedStockInvestments}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={handleSortByChange}
              onToggleSortOrder={handleToggleSortOrder}
              onEditInvestment={handleEditInvestment}
              priceChange={priceChange}
              onAddInvestment={handleAddInvestment}
              emptyMessage="No stock investments found."
              emptyIcon={DollarSign}
              emptyButtonText="Add First Stock"
            />
          </TabsContent>

          <TabsContent value="crypto" className="mt-6 space-y-6">
            <OverallPortfolioSummaryCard
              currentValue={cryptoSummary.currentValue}
              gainLossPercentage={cryptoSummary.totalGainLossPercentage}
            />
            <InvestmentAllocationChart
              title="Crypto Allocation"
              data={cryptoAllocationData}
              emptyMessage="No crypto data to display."
            />
            <InvestmentHoldingsList
              title="Crypto Holdings"
              investments={sortedCryptoInvestments}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={handleSortByChange}
              onToggleSortOrder={handleToggleSortOrder}
              onEditInvestment={handleEditInvestment}
              priceChange={priceChange}
              onAddInvestment={handleAddInvestment}
              emptyMessage="No crypto investments found."
              emptyIcon={Bitcoin}
              emptyButtonText="Add First Crypto"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Investment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="z-[1000] sm:max-w-[425px]" onPointerDown={(e) => e.stopPropagation()}>
          <Card className="bg-card text-foreground card-shadow border border-border/50 p-6"> {/* Apply card styling here */}
            <DialogHeader>
              <DialogTitle>{editingInvestment ? 'Edit Investment' : 'Add New Investment'}</DialogTitle>
            </DialogHeader>
            <InvestmentForm
              investment={editingInvestment}
              onSave={handleSaveInvestment}
              onDelete={handleDeleteInvestment}
              onClose={() => setIsModalOpen(false)}
            />
          </Card>
        </DialogContent>
      </Dialog>

      {/* Fixed Add Button for Mobile */}
      <Button
        className="fixed bottom-20 right-4 sm:hidden rounded-full p-3 shadow-lg bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.05] active:scale-95"
        onClick={handleAddInvestment}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default InvestmentsPage;