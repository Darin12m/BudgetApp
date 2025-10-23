"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2, Filter, SortAsc, Wallet, Bitcoin, LucideIcon, AlertCircle, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { toast } from 'sonner';

import { useInvestmentData, Investment } from '@/hooks/use-investment-data';
import { formatCurrency, calculateGainLoss } from '@/lib/utils';
import InvestmentListItem from '@/components/InvestmentListItem';

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
    let filtered = invList;

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

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2 text-muted-foreground">Loading investments...</span>
    </div>
  );

  const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 m-4">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-destructive mr-2" />
        <div>
          <h3 className="text-sm font-medium text-destructive">Error</h3>
          <p className="text-sm text-destructive mt-1">{message}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  const overallGainLossColor = overallPortfolioSummary.totalGainLossPercentage >= 0 ? 'text-emerald' : 'text-destructive';
  const OverallGainLossIcon: LucideIcon = overallPortfolioSummary.totalGainLossPercentage >= 0 ? TrendingUp : TrendingDown;

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
        <Card className="card-shadow border-none bg-card text-foreground border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold mb-1">{formatCurrency(overallPortfolioSummary.currentValue)}</p>
            <div className="flex items-center space-x-2">
              {OverallGainLossIcon && <OverallGainLossIcon className={`w-4 h-4 ${overallGainLossColor}`} />}
              <span className={`text-sm ${overallGainLossColor}`}>
                {overallPortfolioSummary.totalGainLossPercentage.toFixed(2)}% this month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Stocks and Crypto */}
        <Tabs value={activeTab} onValueChange={(value: 'all' | 'stocks' | 'crypto') => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-xl p-1 card-shadow">
            <TabsTrigger value="all" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">All Holdings</TabsTrigger>
            <TabsTrigger value="stocks" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">Stocks</TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:card-shadow data-[state=active]:border-none data-[state=active]:rounded-lg transition-all text-muted-foreground">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            <Card className="card-shadow border-none bg-card border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Overall Allocation</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                {overallAllocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overallAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {overallAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">No data to display.</p>
                )}
              </CardContent>
            </Card>

            <Card className="card-shadow border-none bg-card border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">All Holdings</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={(value: 'name' | 'gainLossPercentage' | 'totalValue') => setSortBy(value)}>
                    <SelectTrigger className="w-[150px] h-9 text-xs bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
                      <SortAsc className="h-3 w-3 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="gainLossPercentage">Gain/Loss %</SelectItem>
                      <SelectItem value="totalValue">Total Value</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={toggleSortOrder} className="h-9 w-9 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
                    {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getSortedInvestments(investments).length > 0 ? (
                    getSortedInvestments(investments).map(inv => (
                      <InvestmentListItem key={inv.id} investment={inv} onEdit={handleEditInvestment} priceChangeStatus={priceChange.get(inv.id) || 'none'} />
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-semibold text-foreground">No investments found.</p>
                      <p className="text-sm mt-2">Add your first stock or crypto holding to track your portfolio.</p>
                      <Button onClick={handleAddInvestment} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                        Add First Investment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stocks" className="mt-6 space-y-6">
            <Card className="card-shadow border-none bg-card text-foreground border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Stock Portfolio Value</p>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-4xl font-bold mb-1">{formatCurrency(stockSummary.currentValue)}</p>
                <div className="flex items-center space-x-2">
                  {stockSummary.totalGainLossPercentage >= 0 ? <TrendingUp className={`w-4 h-4 text-emerald`} /> : <TrendingDown className={`w-4 h-4 text-destructive`} />}
                  <span className={`text-sm ${stockSummary.totalGainLossPercentage >= 0 ? 'text-emerald' : 'text-destructive'}`}>
                    {stockSummary.totalGainLossPercentage.toFixed(2)}% this month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow border-none bg-card border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Stock Allocation</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                {stockAllocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stockAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">No stock data to display.</p>
                )}
              </CardContent>
            </Card>

            <Card className="card-shadow border-none bg-card border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Stock Holdings</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={(value: 'name' | 'gainLossPercentage' | 'totalValue') => setSortBy(value)}>
                    <SelectTrigger className="w-[150px] h-9 text-xs bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
                      <SortAsc className="h-3 w-3 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="gainLossPercentage">Gain/Loss %</SelectItem>
                      <SelectItem value="totalValue">Total Value</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={toggleSortOrder} className="h-9 w-9 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
                    {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedStockInvestments.length > 0 ? (
                    sortedStockInvestments.map(inv => (
                      <InvestmentListItem key={inv.id} investment={inv} onEdit={handleEditInvestment} priceChangeStatus={priceChange.get(inv.id) || 'none'} />
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-semibold text-foreground">No stock investments found.</p>
                      <p className="text-sm mt-2">Add your first stock holding to track its live performance.</p>
                      <Button onClick={handleAddInvestment} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                        Add First Stock
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto" className="mt-6 space-y-6">
            <Card className="card-shadow border-none bg-card text-foreground border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Crypto Portfolio Value</p>
                  <Bitcoin className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-4xl font-bold mb-1">{formatCurrency(cryptoSummary.currentValue)}</p>
                <div className="flex items-center space-x-2">
                  {cryptoSummary.totalGainLossPercentage >= 0 ? <TrendingUp className={`w-4 h-4 text-emerald`} /> : <TrendingDown className={`w-4 h-4 text-destructive`} />}
                  <span className={`text-sm ${cryptoSummary.totalGainLossPercentage >= 0 ? 'text-emerald' : 'text-destructive'}`}>
                    {cryptoSummary.totalGainLossPercentage.toFixed(2)}% this month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow border-none bg-card border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Crypto Allocation</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                {cryptoAllocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cryptoAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {cryptoAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">No crypto data to display.</p>
                )}
              </CardContent>
            </Card>

            <Card className="card-shadow border-none bg-card border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Crypto Holdings</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={(value: 'name' | 'gainLossPercentage' | 'totalValue') => setSortBy(value)}>
                    <SelectTrigger className="w-[150px] h-9 text-xs bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
                      <SortAsc className="h-3 w-3 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="gainLossPercentage">Gain/Loss %</SelectItem>
                      <SelectItem value="totalValue">Total Value</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={toggleSortOrder} className="h-9 w-9 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
                    {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedCryptoInvestments.length > 0 ? (
                    sortedCryptoInvestments.map(inv => (
                      <InvestmentListItem key={inv.id} investment={inv} onEdit={handleEditInvestment} priceChangeStatus={priceChange.get(inv.id) || 'none'} />
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bitcoin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-semibold text-foreground">No crypto investments found.</p>
                      <p className="text-sm mt-2">Add your first crypto holding to track its live performance.</p>
                      <Button onClick={handleAddInvestment} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                        Add First Crypto
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Investment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="z-[1000] sm:max-w-[425px] bg-card text-foreground card-shadow" onPointerDown={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{editingInvestment ? 'Edit Investment' : 'Add New Investment'}</DialogTitle>
          </DialogHeader>
          <InvestmentForm
            investment={editingInvestment}
            onSave={handleSaveInvestment}
            onDelete={handleDeleteInvestment}
            onClose={() => setIsModalOpen(false)}
          />
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

// --- Investment Form Component for Modal ---
interface InvestmentFormProps {
  investment: Investment | null;
  onSave: (investment: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({ investment, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(investment?.name || '');
  const [type, setType] = useState<'Stock' | 'Crypto'>(investment?.type || 'Stock');
  const [quantity, setQuantity] = useState(investment?.quantity.toString() || '');
  const [buyPrice, setBuyPrice] = useState(investment?.buyPrice.toString() || '');
  const [currentPrice, setCurrentPrice] = useState(investment?.currentPrice.toString() || '');
  const [datePurchased, setDatePurchased] = useState(investment?.datePurchased || format(new Date(), 'yyyy-MM-dd'));
  const [symbol, setSymbol] = useState(investment?.symbol || '');
  const [coingeckoId, setCoingeckoId] = useState(investment?.coingeckoId || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Asset Name is required.';
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = 'Quantity must be a positive number.';
    if (!buyPrice || parseFloat(buyPrice) <= 0) newErrors.buyPrice = 'Buy Price must be a positive number.';
    if (!currentPrice || parseFloat(currentPrice) <= 0) newErrors.currentPrice = 'Current Price must be a positive number.';
    if (!datePurchased) newErrors.datePurchased = 'Date Purchased is required.';
    if (type === 'Stock' && !symbol.trim()) newErrors.symbol = 'Stock Ticker Symbol is required.';
    if (type === 'Crypto' && !coingeckoId.trim()) newErrors.coingeckoId = 'CoinGecko ID is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    onSave({
      name,
      type,
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      currentPrice: parseFloat(currentPrice),
      datePurchased,
      symbol: type === 'Stock' ? symbol : undefined,
      coingeckoId: type === 'Crypto' ? coingeckoId : undefined,
    });
  };

  const handleDeleteClick = () => {
    if (investment?.id) {
      onDelete(investment.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Asset Name
        </Label>
        <div className="col-span-3">
          <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">
          Type
        </Label>
        <Select value={type} onValueChange={(value: 'Stock' | 'Crypto') => setType(value)}>
          <SelectTrigger className="col-span-3 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Stock">Stock</SelectItem>
            <SelectItem value="Crypto">Crypto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'Stock' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="symbol" className="text-right">
            Ticker Symbol
          </Label>
          <div className="col-span-3">
            <Input id="symbol" value={symbol} onChange={(e) => { setSymbol(e.target.value); setErrors(prev => ({ ...prev, symbol: '' })); }} placeholder="e.g., AAPL" className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0" />
            {errors.symbol && <p className="text-destructive text-xs mt-1">{errors.symbol}</p>}
          </div>
        </div>
      )}

      {type === 'Crypto' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="coingeckoId" className="text-right">
            CoinGecko ID
          </Label>
          <div className="col-span-3">
            <Input id="coingeckoId" value={coingeckoId} onChange={(e) => { setCoingeckoId(e.target.value); setErrors(prev => ({ ...prev, coingeckoId: '' })); }} placeholder="e.g., bitcoin" className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0" />
            {errors.coingeckoId && <p className="text-destructive text-xs mt-1">{errors.coingeckoId}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quantity" className="text-right">
          Quantity
        </Label>
        <div className="col-span-3">
          <Input id="quantity" type="number" step="0.0001" value={quantity} onChange={(e) => { setQuantity(e.target.value); setErrors(prev => ({ ...prev, quantity: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0" />
          {errors.quantity && <p className="text-destructive text-xs mt-1">{errors.quantity}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="buyPrice" className="text-right">
          Buy Price
        </Label>
        <div className="col-span-3">
          <Input id="buyPrice" type="number" step="0.01" value={buyPrice} onChange={(e) => { setBuyPrice(e.target.value); setErrors(prev => ({ ...prev, buyPrice: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0" />
          {errors.buyPrice && <p className="text-destructive text-xs mt-1">{errors.buyPrice}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="currentPrice" className="text-right">
          Current Price
        </Label>
        <div className="col-span-3">
          <Input id="currentPrice" type="number" step="0.01" value={currentPrice} onChange={(e) => { setCurrentPrice(e.target.value); setErrors(prev => ({ ...prev, currentPrice: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0" />
          {errors.currentPrice && <p className className="text-destructive text-xs mt-1">{errors.currentPrice}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="datePurchased" className="text-right">
          Date Purchased
        </Label>
        <div className="col-span-3">
          <Input id="datePurchased" type="date" value={datePurchased} onChange={(e) => { setDatePurchased(e.target.value); setErrors(prev => ({ ...prev, datePurchased: '' })); }} className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0" />
          {errors.datePurchased && <p className="text-destructive text-xs mt-1">{errors.datePurchased}</p>}
        </div>
      </div>
      <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
        {investment && (
          <Button type="button" variant="destructive" onClick={handleDeleteClick} className="w-full sm:w-auto transition-transform hover:scale-[1.02] active:scale-98">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98">
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
};

export default InvestmentsPage;