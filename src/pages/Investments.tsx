"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2, Filter, SortAsc, Wallet, Bitcoin, LucideIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
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

const ALLOCATION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

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
    priceChange, // Get price change status
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
    // Filter by type is handled by the tabs, so no need for filterType here.

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading investments...</span>
    </div>
  );

  const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-600 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  const overallGainLossColor = overallPortfolioSummary.totalGainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600';
  const OverallGainLossIcon: LucideIcon = overallPortfolioSummary.totalGainLossPercentage >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-6">
        {error && <ErrorMessage message={error} />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Investments</h1>
          <Button onClick={handleAddInvestment} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Investment</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Overall Portfolio Overview */}
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-100">Total Portfolio Value</p>
              <Wallet className="h-5 w-5 text-blue-100" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Holdings</TabsTrigger>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
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
                  <p className="text-gray-500 dark:text-gray-400">No data to display.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">All Holdings</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={(value: 'name' | 'gainLossPercentage' | 'totalValue') => setSortBy(value)}>
                    <SelectTrigger className="w-[150px] h-9 text-xs">
                      <SortAsc className="h-3 w-3 mr-2" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="gainLossPercentage">Gain/Loss %</SelectItem>
                      <SelectItem value="totalValue">Total Value</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={toggleSortOrder} className="h-9 w-9">
                    {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
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
                    <p className="text-center text-gray-500 py-4">No investments found. Add one to get started!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stocks" className="mt-6 space-y-6">
            <Card className="shadow-sm border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-blue-100">Stock Portfolio Value</p>
                  <DollarSign className="h-5 w-5 text-blue-100" />
                </div>
                <p className="text-4xl font-bold mb-1">{formatCurrency(stockSummary.currentValue)}</p>
                <div className="flex items-center space-x-2">
                  {stockSummary.totalGainLossPercentage >= 0 ? <TrendingUp className={`w-4 h-4 text-green-600`} /> : <TrendingDown className={`w-4 h-4 text-red-600`} />}
                  <span className={`text-sm ${stockSummary.totalGainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockSummary.totalGainLossPercentage.toFixed(2)}% this month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
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
                  <p className="text-gray-500 dark:text-gray-400">No stock data to display.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Stock Holdings</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={(value: 'name' | 'gainLossPercentage' | 'totalValue') => setSortBy(value)}>
                    <SelectTrigger className="w-[150px] h-9 text-xs">
                      <SortAsc className="h-3 w-3 mr-2" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="gainLossPercentage">Gain/Loss %</SelectItem>
                      <SelectItem value="totalValue">Total Value</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={toggleSortOrder} className="h-9 w-9">
                    {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
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
                    <p className="text-center text-gray-500 py-4">No stock investments found. Add one to get started!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto" className="mt-6 space-y-6">
            <Card className="shadow-sm border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-amber-100">Crypto Portfolio Value</p>
                  <Bitcoin className="h-5 w-5 text-amber-100" />
                </div>
                <p className="text-4xl font-bold mb-1">{formatCurrency(cryptoSummary.currentValue)}</p>
                <div className="flex items-center space-x-2">
                  {cryptoSummary.totalGainLossPercentage >= 0 ? <TrendingUp className={`w-4 h-4 text-green-600`} /> : <TrendingDown className={`w-4 h-4 text-red-600`} />}
                  <span className={`text-sm ${cryptoSummary.totalGainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cryptoSummary.totalGainLossPercentage.toFixed(2)}% this month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
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
                  <p className="text-gray-500 dark:text-gray-400">No crypto data to display.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Crypto Holdings</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={(value: 'name' | 'gainLossPercentage' | 'totalValue') => setSortBy(value)}>
                    <SelectTrigger className="w-[150px] h-9 text-xs">
                      <SortAsc className="h-3 w-3 mr-2" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="gainLossPercentage">Gain/Loss %</SelectItem>
                      <SelectItem value="totalValue">Total Value</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={toggleSortOrder} className="h-9 w-9">
                    {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
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
                    <p className="text-center text-gray-500 py-4">No crypto investments found. Add one to get started!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Investment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
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
        className="fixed bottom-20 right-4 sm:hidden rounded-full p-3 shadow-lg"
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
  const [symbol, setSymbol] = useState(investment?.symbol || ''); // New state for stock symbol
  const [coingeckoId, setCoingeckoId] = useState(investment?.coingeckoId || ''); // New state for crypto ID
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
    // onClose is called by onSave after successful operation
  };

  const handleDeleteClick = () => {
    if (investment?.id) {
      onDelete(investment.id);
      // onClose is called by onDelete after successful operation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Asset Name
        </Label>
        <div className="col-span-3">
          <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">
          Type
        </Label>
        <Select value={type} onValueChange={(value: 'Stock' | 'Crypto') => setType(value)}>
          <SelectTrigger className="col-span-3">
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
            <Input id="symbol" value={symbol} onChange={(e) => { setSymbol(e.target.value); setErrors(prev => ({ ...prev, symbol: '' })); }} placeholder="e.g., AAPL" />
            {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>}
          </div>
        </div>
      )}

      {type === 'Crypto' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="coingeckoId" className="text-right">
            CoinGecko ID
          </Label>
          <div className="col-span-3">
            <Input id="coingeckoId" value={coingeckoId} onChange={(e) => { setCoingeckoId(e.target.value); setErrors(prev => ({ ...prev, coingeckoId: '' })); }} placeholder="e.g., bitcoin" />
            {errors.coingeckoId && <p className="text-red-500 text-xs mt-1">{errors.coingeckoId}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quantity" className="text-right">
          Quantity
        </Label>
        <div className="col-span-3">
          <Input id="quantity" type="number" step="0.0001" value={quantity} onChange={(e) => { setQuantity(e.target.value); setErrors(prev => ({ ...prev, quantity: '' })); }} />
          {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="buyPrice" className="text-right">
          Buy Price
        </Label>
        <div className="col-span-3">
          <Input id="buyPrice" type="number" step="0.01" value={buyPrice} onChange={(e) => { setBuyPrice(e.target.value); setErrors(prev => ({ ...prev, buyPrice: '' })); }} />
          {errors.buyPrice && <p className="text-red-500 text-xs mt-1">{errors.buyPrice}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="currentPrice" className="text-right">
          Current Price
        </Label>
        <div className="col-span-3">
          <Input id="currentPrice" type="number" step="0.01" value={currentPrice} onChange={(e) => { setCurrentPrice(e.target.value); setErrors(prev => ({ ...prev, currentPrice: '' })); }} />
          {errors.currentPrice && <p className="text-red-500 text-xs mt-1">{errors.currentPrice}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="datePurchased" className="text-right">
          Date Purchased
        </Label>
        <div className="col-span-3">
          <Input id="datePurchased" type="date" value={datePurchased} onChange={(e) => { setDatePurchased(e.target.value); setErrors(prev => ({ ...prev, datePurchased: '' })); }} />
          {errors.datePurchased && <p className="text-red-500 text-xs mt-1">{errors.datePurchased}</p>}
        </div>
      </div>
      <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
        {investment && (
          <Button type="button" variant="destructive" onClick={handleDeleteClick} className="w-full sm:w-auto">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
};

export default InvestmentsPage;