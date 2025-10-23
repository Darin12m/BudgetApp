"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2, Filter, SortAsc, RefreshCcw, Wallet, BarChart3, X, Save, CalendarDays, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

// --- Interfaces ---
interface Investment {
  id: string;
  name: string;
  type: 'Stock' | 'Crypto';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  datePurchased: string; // YYYY-MM-DD
  ownerUid: string;
}

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  bestPerformer: Investment | null;
  worstPerformer: Investment | null;
}

interface AllocationData {
  name: string;
  value: number;
  color: string;
}

interface PerformanceChartData {
  date: string;
  value: number;
}

interface TopPerformerData {
  name: string;
  gainPercentage: number;
  color: string;
}

// --- Mock Data (for charts that don't directly use investment data) ---
const MOCK_PERFORMANCE_DATA: PerformanceChartData[] = [
  { date: 'Jan', value: 10000 },
  { date: 'Feb', value: 10500 },
  { date: 'Mar', value: 11200 },
  { date: 'Apr', value: 10800 },
  { date: 'May', value: 11500 },
  { date: 'Jun', value: 12000 },
  { date: 'Jul', value: 12800 },
  { date: 'Aug', value: 13500 },
  { date: 'Sep', value: 13200 },
  { date: 'Oct', value: 14000 },
];

const ALLOCATION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

// --- Utility Functions ---
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const calculateGainLoss = (investment: Investment) => {
  const invested = investment.quantity * investment.buyPrice;
  const currentValue = investment.quantity * investment.currentPrice;
  const gainLoss = currentValue - invested;
  const gainLossPercentage = invested === 0 ? 0 : (gainLoss / invested) * 100;
  return { gainLoss, gainLossPercentage };
};

interface InvestmentsPageProps {
  userUid: string | null;
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ userUid }) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [filterType, setFilterType] = useState<'All' | 'Stock' | 'Crypto'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'gainLossPercentage' | 'totalValue'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // --- Real-time data fetching with Firebase onSnapshot ---
  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, "investments"), where("ownerUid", "==", userUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedInvestments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Investment[];
      setInvestments(fetchedInvestments);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching investments:", err);
      setError("Failed to load investments. Please check your internet connection and Firebase rules.");
      setLoading(false);
      toast.error("Failed to load investments.");
    });

    return () => unsubscribe(); // Clean up the listener
  }, [userUid]);

  // --- Computed Portfolio Summary ---
  const portfolioSummary: PortfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let currentValue = 0;
    let bestPerformer: Investment | null = null;
    let worstPerformer: Investment | null = null;
    let maxGain = -Infinity;
    let minGain = Infinity;

    investments.forEach(inv => {
      const invested = inv.quantity * inv.buyPrice;
      const current = inv.quantity * inv.currentPrice;
      totalInvested += invested;
      currentValue += current;

      const { gainLossPercentage } = calculateGainLoss(inv);

      if (gainLossPercentage > maxGain) {
        maxGain = gainLossPercentage;
        bestPerformer = inv;
      }
      if (gainLossPercentage < minGain) {
        minGain = gainLossPercentage;
        worstPerformer = inv;
      }
    });

    const totalGainLoss = currentValue - totalInvested;
    const totalGainLossPercentage = totalInvested === 0 ? 0 : (totalGainLoss / totalInvested) * 100;

    return {
      totalInvested,
      currentValue,
      totalGainLoss,
      totalGainLossPercentage,
      bestPerformer,
      worstPerformer,
    };
  }, [investments]);

  // --- Filtered and Sorted Investments ---
  const filteredAndSortedInvestments = useMemo(() => {
    let filtered = investments;
    if (filterType !== 'All') {
      filtered = investments.filter(inv => inv.type === filterType);
    }

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
  }, [investments, filterType, sortBy, sortOrder]);

  // --- Chart Data ---
  const allocationData: AllocationData[] = useMemo(() => {
    const stockValue = investments
      .filter(inv => inv.type === 'Stock')
      .reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const cryptoValue = investments
      .filter(inv => inv.type === 'Crypto')
      .reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);

    const data = [];
    if (stockValue > 0) data.push({ name: 'Stocks', value: stockValue, color: ALLOCATION_COLORS[0] });
    if (cryptoValue > 0) data.push({ name: 'Crypto', value: cryptoValue, color: ALLOCATION_COLORS[1] });
    return data;
  }, [investments]);

  const topPerformersData: TopPerformerData[] = useMemo(() => {
    return investments
      .map(inv => ({
        name: inv.name,
        gainPercentage: calculateGainLoss(inv).gainLossPercentage,
        color: calculateGainLoss(inv).gainLossPercentage >= 0 ? '#10b981' : '#ef4444',
      }))
      .sort((a, b) => b.gainPercentage - a.gainPercentage)
      .slice(0, 5);
  }, [investments]);

  // --- Handlers (now operating on Firebase) ---
  const handleAddInvestment = useCallback(() => {
    setEditingInvestment(null);
    setIsModalOpen(true);
  }, []);

  const handleEditInvestment = useCallback((investment: Investment) => {
    setEditingInvestment(investment);
    setIsModalOpen(true);
  }, []);

  const handleSaveInvestment = useCallback(async (newInvestment: Omit<Investment, 'id' | 'ownerUid'>) => {
    if (!userUid) {
      toast.error("Authentication required to save investment.");
      return;
    }
    try {
      if (editingInvestment) {
        await updateDoc(doc(db, "investments", editingInvestment.id), {
          ...newInvestment,
          updatedAt: serverTimestamp(),
        });
        toast.success("Investment updated successfully!");
      } else {
        await addDoc(collection(db, "investments"), {
          ...newInvestment,
          ownerUid: userUid,
          createdAt: serverTimestamp(),
        });
        toast.success("Investment added successfully!");
      }
      setIsModalOpen(false);
      setEditingInvestment(null);
    } catch (e) {
      console.error("Error saving investment:", e);
      toast.error("Failed to save investment.");
    }
  }, [editingInvestment, userUid]);

  const handleDeleteInvestment = useCallback(async (id: string) => {
    if (!userUid) {
      toast.error("Authentication required to delete investment.");
      return;
    }
    if (confirm('Are you sure you want to delete this investment?')) {
      try {
        await deleteDoc(doc(db, "investments", id));
        toast.success("Investment deleted successfully!");
        setIsModalOpen(false);
        setEditingInvestment(null);
      } catch (e) {
        console.error("Error deleting investment:", e);
        toast.error("Failed to delete investment.");
      }
    }
  }, [userUid]);

  const handleRefreshPrices = useCallback(() => {
    // For a real app, this would call an external API to get updated prices.
    // For now, we'll simulate a small random change.
    const updatedInvestments = investments.map(inv => ({
      ...inv,
      currentPrice: inv.currentPrice * (1 + (Math.random() * 0.02 - 0.01)) // +/- 1%
    }));
    // Since onSnapshot is active, we don't directly set state here.
    // Instead, we'd update the Firestore documents, and onSnapshot would
    // automatically update the local state.
    // For this simulation, we'll just update local state directly.
    setInvestments(updatedInvestments);
    toast.info("Simulated price refresh!");
  }, [investments]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  // --- Automatic Refresh Effect ---
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      handleRefreshPrices();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval); // Clean up the interval on component unmount
  }, [handleRefreshPrices]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-6">
        {error && <ErrorMessage message={error} />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Investments</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefreshPrices} className="flex items-center space-x-2">
              <RefreshCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh Prices</span>
            </Button>
            <Button onClick={handleAddInvestment} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Investment</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Portfolio Overview</CardTitle>
            <Wallet className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Invested</p>
                <p className="text-lg sm:text-xl font-bold">{formatCurrency(portfolioSummary.totalInvested)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
                <p className="text-lg sm:text-xl font-bold">{formatCurrency(portfolioSummary.currentValue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Gain/Loss</p>
                <p className={`text-lg sm:text-xl font-bold ${portfolioSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(portfolioSummary.totalGainLoss)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gain/Loss %</p>
                <p className={`text-lg sm:text-xl font-bold ${portfolioSummary.totalGainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioSummary.totalGainLossPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="h-[150px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_PERFORMANCE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" style={{ fontSize: '10px' }} />
                  <YAxis stroke="hsl(var(--foreground))" style={{ fontSize: '10px' }} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-gray-600 dark:text-gray-400">Best Performer:</span>
                <span className="font-semibold">{portfolioSummary.bestPerformer?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-gray-600 dark:text-gray-400">Worst Performer:</span>
                <span className="font-semibold">{portfolioSummary.worstPerformer?.name || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Holdings */}
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">My Holdings</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={filterType} onValueChange={(value: 'All' | 'Stock' | 'Crypto') => setFilterType(value)}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Stock">Stocks</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
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
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Buy Price</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Gain/Loss (%)</TableHead>
                    <TableHead>Purchased</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedInvestments.map(inv => {
                    const { gainLossPercentage } = calculateGainLoss(inv);
                    const totalValue = inv.quantity * inv.currentPrice;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.name}</TableCell>
                        <TableCell>{inv.type}</TableCell>
                        <TableCell>{inv.quantity}</TableCell>
                        <TableCell>{formatCurrency(inv.buyPrice)}</TableCell>
                        <TableCell>{formatCurrency(inv.currentPrice)}</TableCell>
                        <TableCell>{formatCurrency(totalValue)}</TableCell>
                        <TableCell className={gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {gainLossPercentage.toFixed(2)}%
                        </TableCell>
                        <TableCell>{inv.datePurchased}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditInvestment(inv)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {filteredAndSortedInvestments.map(inv => {
                const { gainLoss, gainLossPercentage } = calculateGainLoss(inv);
                const totalValue = inv.quantity * inv.currentPrice;
                return (
                  <Card key={inv.id} className="p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{inv.name} <span className="text-sm text-gray-500">({inv.type})</span></h3>
                      <Button variant="ghost" size="icon" onClick={() => handleEditInvestment(inv)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600 dark:text-gray-400">Qty:</span> {inv.quantity}</div>
                      <div><span className="text-gray-600 dark:text-gray-400">Buy Price:</span> {formatCurrency(inv.buyPrice)}</div>
                      <div><span className="text-gray-600 dark:text-gray-400">Current Price:</span> {formatCurrency(inv.currentPrice)}</div>
                      <div><span className="text-gray-600 dark:text-gray-400">Total Value:</span> {formatCurrency(totalValue)}</div>
                      <div><span className="text-gray-600 dark:text-gray-400">Purchased:</span> {inv.datePurchased}</div>
                      <div className={gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        <span className="text-gray-600 dark:text-gray-400">Gain/Loss:</span> {gainLossPercentage.toFixed(2)}%
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Portfolio Allocation</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              {allocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {allocationData.map((entry, index) => (
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
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top 5 Performers (% Gain)</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              {topPerformersData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPerformersData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" style={{ fontSize: '10px' }} />
                    <YAxis stroke="hsl(var(--foreground))" style={{ fontSize: '10px' }} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value) => `${Number(value).toFixed(2)}%`}
                    />
                    <Bar dataKey="gainPercentage" fill="#8884d8">
                      {topPerformersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No data to display.</p>
              )}
            </CardContent>
          </Card>
        </div>
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
  onSave: (investment: Omit<Investment, 'id' | 'ownerUid'>) => void;
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Asset Name is required.';
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = 'Quantity must be a positive number.';
    if (!buyPrice || parseFloat(buyPrice) <= 0) newErrors.buyPrice = 'Buy Price must be a positive number.';
    if (!currentPrice || parseFloat(currentPrice) <= 0) newErrors.currentPrice = 'Current Price must be a positive number.';
    if (!datePurchased) newErrors.datePurchased = 'Date Purchased is required.';
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