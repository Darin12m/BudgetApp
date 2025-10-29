"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, DollarSign, Key, User, LogOut, ChevronLeft, ChevronRight, Palette, Zap, BellRing, Menu, Calendar, Landmark, FileText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import BottomNavBar from '@/components/BottomNavBar';
import { useFinanceData } from '@/hooks/use-finance-data';
import { auth, db } from '@/lib/firebase'; // Import db for data deletion
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency, CURRENCIES } from '@/context/CurrencyContext';
import { useDateRange } from '@/context/DateRangeContext';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import i18n from '@/i18n'; // Import i18n instance
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Firestore imports for deletion

interface SettingsPageProps {
  userUid: string | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userUid }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { isDarkMode, toggleTheme } = useTheme();
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<string>('');
  const [microInvestingEnabled, setMicroInvestingEnabled] = useState<boolean>(true);
  const [microInvestingPercentage, setMicroInvestingPercentage] = useState<string>('30');
  const [priceAlertThresholdInput, setPriceAlertThresholdInput] = useState<string>('5');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isDeleteDataConfirmOpen, setIsDeleteDataConfirmOpen] = useState(false); // State for delete data confirmation

  const { selectedRange } = useDateRange();
  const { budgetSettings, updateDocument, loading: financeLoading, transactions, categories, goals } = useFinanceData(userUid, selectedRange.from, selectedRange.to);
  const { selectedCurrency, setCurrency, convertInputToUSD, convertUSDToSelected } = useCurrency();

  const navigate = useNavigate();

  useEffect(() => {
    if (budgetSettings && budgetSettings.id) {
      setMonthlyBudgetInput(convertUSDToSelected(budgetSettings.totalBudgeted || 0).toString());
      setMicroInvestingEnabled(budgetSettings.microInvestingEnabled ?? true);
      setMicroInvestingPercentage(budgetSettings.microInvestingPercentage?.toString() || '30');
      setPriceAlertThresholdInput(budgetSettings.priceAlertThreshold?.toString() || '5');
    }
  }, [budgetSettings, convertUSDToSelected]);

  const handleSaveMonthlyBudget = async () => {
    if (!userUid || !budgetSettings?.id) {
      toast.error(t("common.error"));
      return;
    }
    const newBudget = parseFloat(monthlyBudgetInput);
    if (isNaN(newBudget) || newBudget <= 0) {
      toast.error(t("common.error"));
      return;
    }
    const newBudgetInUSD = convertInputToUSD(newBudget);
    try {
      await updateDocument('budgetSettings', budgetSettings.id, {
        totalBudgeted: newBudgetInUSD,
        inputCurrencyCode: selectedCurrency.code,
      });
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Error updating monthly budget:", error);
      toast.error(t("common.error"));
    }
  };

  const handleSaveMicroInvestingSettings = async () => {
    if (!userUid || !budgetSettings?.id) {
      toast.error(t("common.error"));
      return;
    }
    const newPercentage = parseFloat(microInvestingPercentage);
    if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
      toast.error(t("common.error"));
      return;
    }
    try {
      await updateDocument('budgetSettings', budgetSettings.id, {
        microInvestingEnabled: microInvestingEnabled,
        microInvestingPercentage: newPercentage,
      });
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Error updating micro-investing settings:", error);
      toast.error(t("common.error"));
    }
  };

  const handleSavePriceAlertThreshold = async () => {
    if (!userUid || !budgetSettings?.id) {
      toast.error(t("common.error"));
      return;
    }
    const newThreshold = parseFloat(priceAlertThresholdInput);
    if (isNaN(newThreshold) || newThreshold < 0) {
      toast.error(t("common.error"));
      return;
    }
    try {
      await updateDocument('budgetSettings', budgetSettings.id, { priceAlertThreshold: newThreshold });
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Error updating price alert threshold:", error);
      toast.error(t("common.error"));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success(t("common.success"));
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error(t("common.error"));
    }
  };

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

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng); // Persist language choice
    toast.success(t("common.success"));
  };

  const exportDataAsCsv = useCallback(() => {
    if (!userUid) {
      toast.error(t("common.error"));
      return;
    }

    const date = format(new Date(), 'yyyy-MM-dd');
    const filename = `FinanceFlow_Export_${date}.csv`;

    let csvContent = '';

    // Helper to convert array of objects to CSV string
    const arrayToCsv = (arr: any[], title: string) => {
      if (arr.length === 0) return '';
      const headers = Object.keys(arr[0]);
      const headerRow = headers.join(',');
      const dataRows = arr.map(row => headers.map(header => {
        const value = row[header];
        // Handle potential commas in string values by wrapping in quotes
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','));
      return `${title}\n${headerRow}\n${dataRows.join('\n')}\n\n`;
    };

    csvContent += arrayToCsv(transactions, 'Transactions');
    csvContent += arrayToCsv(categories, 'Categories');
    csvContent += arrayToCsv(goals, 'Goals');
    // Add other collections as needed (e.g., investments, recurringTransactions)

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t("common.success"));
    } else {
      toast.error(t("common.error"));
    }
  }, [userUid, transactions, categories, goals, t]);

  const handleDeleteAllUserData = useCallback(async () => {
    if (!userUid) {
      toast.error(t("common.error"));
      return;
    }

    const collectionsToDelete = [
      'accounts', 'budgetSettings', 'categories', 'goals',
      'investments', 'portfolioSnapshots', 'recurringTransactions', 'transactions'
    ];

    try {
      for (const collectionName of collectionsToDelete) {
        const q = query(collection(db, collectionName), where("ownerUid", "==", userUid));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, collectionName, d.id)));
        await Promise.all(deletePromises);
      }
      await signOut(auth); // Sign out after deleting data
      toast.success(t("common.success"));
      navigate('/login');
    } catch (error) {
      console.error("Error deleting all user data:", error);
      toast.error(t("common.error"));
    } finally {
      setIsDeleteDataConfirmOpen(false);
    }
  }, [userUid, navigate, t]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} onViewChange={handleViewChange} userUid={userUid} />

      <div className={`flex flex-col flex-1 min-w-0 ${sidebarOpen ? 'sm:ml-72' : 'sm:ml-0'} transition-all duration-300 ease-in-out`}>
        <header className="bg-card backdrop-blur-lg border-b border-border sticky top-0 z-40 safe-top card-shadow transition-colors duration-300">
          <div className="flex items-center px-4 sm:px-6 py-3 sm:py-4">
            <button
              onClick={handleSidebarToggle}
              className="p-2 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted flex-shrink-0 mr-2 sm:mr-4"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold">{t("settings.title")}</h1>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          <div className="space-y-6 sm:space-y-8">
            {/* Theme Settings */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.theme")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode-toggle" className="flex items-center text-base">
                    {isDarkMode ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                    {t("settings.darkMode")}
                  </Label>
                  <Switch
                    id="dark-mode-toggle"
                    checked={isDarkMode}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.language")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="app-language" className="text-base">{t("settings.appLanguage")}</Label>
                  <Select value={i18n.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
                      <SelectValue placeholder={t("settings.selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English 🇬🇧</SelectItem>
                      <SelectItem value="mk">Македонски 🇲🇰</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Currency Settings */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Landmark className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.currency")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="main-currency" className="text-base">{t("settings.mainCurrency")}</Label>
                  <Select value={selectedCurrency.code} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
                      <SelectValue placeholder={t("settings.selectCurrency")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Budget Settings */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.budget")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="monthly-budget" className="text-base">{t("settings.monthlyBudget")}</Label>
                  <Input
                    id="monthly-budget"
                    type="number"
                    step="0.01"
                    value={monthlyBudgetInput}
                    onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                    placeholder={`${selectedCurrency.symbol} 3000.00`}
                    className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
                  />
                  <Button onClick={handleSaveMonthlyBudget} className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground">
                    {t("settings.saveMonthlyBudget")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Micro-Investing Settings */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.microInvesting")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="micro-investing-toggle" className="flex items-center text-base">
                    {t("settings.enableSuggestions")}
                  </Label>
                  <Switch
                    id="micro-investing-toggle"
                    checked={microInvestingEnabled}
                    onCheckedChange={setMicroInvestingEnabled}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="micro-investing-percentage" className="text-base">
                    {t("settings.suggestionPercentage")}
                  </Label>
                  <Input
                    id="micro-investing-percentage"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={microInvestingPercentage}
                    onChange={(e) => setMicroInvestingPercentage(e.target.value)}
                    placeholder="e.g., 30"
                    className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
                  />
                  <Button onClick={handleSaveMicroInvestingSettings} className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground">
                    {t("settings.saveMicroInvestingSettings")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Price Alerts Settings */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BellRing className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.priceAlerts")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="price-alert-threshold" className="text-base">
                    {t("settings.alertThreshold")}
                  </Label>
                  <Input
                    id="price-alert-threshold"
                    type="number"
                    step="0.1"
                    min="0"
                    value={priceAlertThresholdInput}
                    onChange={(e) => setPriceAlertThresholdInput(e.target.value)}
                    placeholder="e.g., 5 for ±5%"
                    className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
                  />
                  <Button onClick={handleSavePriceAlertThreshold} className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground">
                    {t("settings.saveAlertThreshold")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.dataManagement")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={exportDataAsCsv} variant="ghost" className="w-full justify-between text-base px-4 py-6 hover:bg-muted/50">
                  {t("settings.exportData")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Separator />
                <Button variant="ghost" className="w-full justify-between text-base px-4 py-6 hover:bg-muted/50">
                  {t("settings.readPrivacyNotice")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Separator />
                <AlertDialog open={isDeleteDataConfirmOpen} onOpenChange={setIsDeleteDataConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-base px-4 py-6 text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-5 h-5 mr-2" /> {t("settings.deleteMyData")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card text-foreground card-shadow border border-border/50">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("settings.deleteDataConfirmationTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("settings.deleteDataConfirmationDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllUserData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <User className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.account")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-between text-base px-4 py-6 hover:bg-muted/50">
                  {t("settings.manageProfile")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Separator />
                <Button variant="ghost" className="w-full justify-between text-base px-4 py-6 hover:bg-muted/50">
                  {t("settings.connectedAccounts")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Separator />
                <Button onClick={handleSignOut} variant="ghost" className="w-full justify-between text-base px-4 py-6 text-destructive hover:bg-destructive/10">
                  <LogOut className="w-5 h-5 mr-2" /> {t("settings.signOut")}
                </Button>
              </CardContent>
            </Card>

            {/* API Integrations (Placeholder) */}
            <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Key className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.apiIntegrations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t("settings.apiIntegrationsDescription")}
                </p>
                <Button variant="outline" className="mt-4 w-full bg-muted/50 hover:bg-muted">
                  {t("settings.viewIntegrations")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <BottomNavBar />
      </div>
    </div>
  );
};

export default SettingsPage;