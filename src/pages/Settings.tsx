"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun, Moon, DollarSign, Key, User, LogOut, ChevronRight, Palette, Zap, BellRing, Menu, Calendar, Landmark, FileText, Trash2,
  Lock, Mail, UserCircle, ShieldCheck, Clock, Database, Upload, Download, Globe, Info, Gavel, Link as LinkIcon, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import BottomNavBar from '@/components/BottomNavBar';
import { useFinanceData } from '@/hooks/use-finance-data';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header'; // Import Header
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency, CURRENCIES } from '@/context/CurrencyContext';
import { useDateRange } from '@/context/DateRangeContext';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
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
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { exportAllUserData } from '@/lib/data-export'; // Import the new export utility
import { motion } from 'framer-motion';

interface SettingsPageProps {
  userUid: string | null;
  setShowProfilePopup: (show: boolean) => void; // New prop
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userUid, setShowProfilePopup }) => {
  const { t } = useTranslation();
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<string>('');
  const [microInvestingEnabled, setMicroInvestingEnabled] = useState<boolean>(true);
  const [microInvestingPercentage, setMicroInvestingPercentage] = useState<string>('30');
  const [priceAlertThresholdInput, setPriceAlertThresholdInput] = useState<string>('5');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isDeleteDataConfirmOpen, setIsDeleteDataConfirmOpen] = useState(false);

  const { selectedRange } = useDateRange();
  const { budgetSettings, updateDocument, loading: financeLoading, transactions, categories, goals } = useFinanceData(userUid, selectedRange.from, selectedRange.to);
  const { selectedCurrency, convertInputToUSD, convertUSDToSelected } = useCurrency();
  const { isDarkMode, toggleTheme } = useTheme(); // For theme toggle in settings

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
      await signOut(auth);
      toast.success(t("settings.deleteDataSuccess"));
      navigate('/login');
    } catch (error) {
      console.error("Error deleting all user data:", error);
      toast.error(t("settings.deleteDataError"));
    } finally {
      setIsDeleteDataConfirmOpen(false);
    }
  }, [userUid, navigate, t]);

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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} onViewChange={handleViewChange} userUid={userUid} setShowProfilePopup={setShowProfilePopup} />

      <div className={`flex flex-col flex-1 min-w-0 ${sidebarOpen ? 'sm:ml-72' : 'sm:ml-0'} transition-all duration-300 ease-in-out`}>
        <Header
          title={t("navigation.settings")}
          onSidebarToggle={handleSidebarToggle}
          setShowProfilePopup={setShowProfilePopup}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6 sm:space-y-8"
          >

            {/* Account Info */}
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center tracking-tight">
                  <UserCircle className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.accountInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.changeName")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.changeEmail")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.changePassword")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <div className="flex items-center justify-between px-4 py-3">
                  <Label htmlFor="2fa-toggle" className="flex items-center text-base cursor-pointer">
                    <ShieldCheck className="w-5 h-5 mr-2 text-muted-foreground" />
                    {t("settings.enableTwoFactorAuth")}
                  </Label>
                  <Switch id="2fa-toggle" checked={false} onCheckedChange={() => toast.info(t("common.comingSoon"))} />
                </div>
                <Separator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.01, x: 5 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-5 h-5 mr-2" /> {t("settings.deleteAccount")}
                    </motion.button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glassmorphic-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("settings.deleteAccountConfirmationTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("settings.deleteAccountConfirmationDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => toast.info(t("common.comingSoon"))} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Budget Settings */}
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center tracking-tight">
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
                    className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
                  />
                  <Button onClick={handleSaveMonthlyBudget} className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground min-h-[44px]">
                    {t("settings.saveMonthlyBudget")}
                  </Button>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="default-budget-period" className="text-base">{t("settings.defaultBudgetPeriod")}</Label>
                  <Select value="monthly" onValueChange={() => toast.info(t("common.comingSoon"))}>
                    <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
                      <SelectValue placeholder={t("settings.selectPeriod")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{t("settings.monthly")}</SelectItem>
                      <SelectItem value="weekly">{t("settings.weekly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="rollover-toggle" className="flex items-center text-base cursor-pointer">
                    <ArrowRight className="w-5 h-5 mr-2 text-muted-foreground" />
                    {t("settings.autoRolloverBudgets")}
                  </Label>
                  <Switch
                    id="rollover-toggle"
                    checked={budgetSettings.rolloverEnabled}
                    onCheckedChange={(checked) => updateDocument('budgetSettings', budgetSettings.id, { rolloverEnabled: checked })}
                  />
                </div>
                <Separator />
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
                    className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
                  />
                  <Button onClick={handleSaveMicroInvestingSettings} className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground min-h-[44px]">
                    {t("settings.saveMicroInvestingSettings")}
                  </Button>
                </div>
                <Separator />
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
                    className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
                  />
                  <Button onClick={handleSavePriceAlertThreshold} className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground min-h-[44px]">
                    {t("settings.saveAlertThreshold")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center tracking-tight">
                  <Database className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.dataManagement")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Upload className="w-5 h-5 mr-2" /> {t("settings.importCSV")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Download className="w-5 h-5 mr-2" /> {t("settings.exportCSVAdvanced")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Database className="w-5 h-5 mr-2" /> {t("settings.backupData")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Download className="w-5 h-5 mr-2" /> {t("settings.restoreFromBackup")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </CardContent>
            </Card>

            {/* Localization */}
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center tracking-tight">
                  <Globe className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.localization")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2">
                  <Label htmlFor="default-currency-settings" className="text-base">{t("settings.defaultCurrency")}</Label>
                  <Select value={selectedCurrency.code} onValueChange={(value) => { setCurrency(value); toast.info(t("common.comingSoon")); }}>
                    <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
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
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Clock className="w-5 h-5 mr-2" /> {t("settings.regionTimezone")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="app-language-settings" className="text-base">{t("settings.appLanguage")}</Label>
                  <Select value={i18n.language} onValueChange={(value) => { i18n.changeLanguage(value); localStorage.setItem('i18nextLng', value); toast.info(t("common.comingSoon")); }}>
                    <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
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

            {/* Integrations (Placeholder) */}
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center tracking-tight">
                  <Key className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.apiIntegrations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground text-sm mb-4">
                  {t("settings.apiIntegrationsDescription")}
                </p>
                {/* Connected Accounts - Hidden for now */}
                {/* <Button variant="ghost" className="w-full justify-between text-base px-4 py-6 hover:bg-muted/50">
                  {t("settings.connectedAccounts")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Separator /> */}
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <LinkIcon className="w-5 h-5 mr-2" /> {t("settings.bankConnections")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <img src="/icons/google.svg" alt="Google" className="w-5 h-5 mr-2" /> {t("settings.googleSignIn")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center tracking-tight">
                  <Info className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.privacy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.gdprNotice")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.privacyPolicy")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg hover:bg-muted/50 transition-all"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.termsOfService")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <Separator />
                <AlertDialog open={isDeleteDataConfirmOpen} onOpenChange={setIsDeleteDataConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.01, x: 5 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex justify-between items-center text-base px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-5 h-5 mr-2" /> {t("settings.deleteAllPersonalData")}
                    </motion.button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glassmorphic-card">
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
          </motion.div>
        </main>
        <BottomNavBar />
      </div>
    </div>
  );
};

export default SettingsPage;