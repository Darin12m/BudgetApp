"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun, Moon, DollarSign, Key, User, LogOut, ChevronRight, Palette, Zap, BellRing, Menu, Calendar, Landmark, FileText, Trash2,
  Lock, Mail, UserCircle, ShieldCheck, Clock, Database, Upload, Download, Globe, Info, Gavel, Link as LinkIcon, ArrowRight,
  Eye, EyeOff, Loader2, AtSign, KeyRound, User as UserIcon, Save // Added Eye, EyeOff, Loader2, AtSign, KeyRound, UserIcon
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
import {
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  AuthCredential // Import AuthCredential
} from 'firebase/auth'; // Added Firebase Auth functions
import { doc, updateDoc, setDoc } from 'firebase/firestore'; // Added Firestore functions
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
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { exportAllUserData } from '@/lib/data-export'; // Import the new export utility
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Import Dialog components
import { useAuth } from '@/context/AuthContext'; // Import useAuth to get current user

interface SettingsPageProps {
  userUid: string | null;
  setShowProfilePopup: (show: boolean) => void; // New prop
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userUid, setShowProfilePopup }) => {
  const { t } = useTranslation();
  const { user } = useAuth(); // Get the current user from AuthContext
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<string>('');
  const [microInvestingEnabled, setMicroInvestingEnabled] = useState<boolean>(true);
  const [microInvestingPercentage, setMicroInvestingPercentage] = useState<string>('30');
  const [priceAlertThresholdInput, setPriceAlertThresholdInput] = useState<string>('5');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isDeleteDataConfirmOpen, setIsDeleteDataConfirmOpen] = useState(false);

  // Account Management States
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || '');
  const [newEmailInput, setNewEmailInput] = useState(user?.email || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');

  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const { selectedRange } = useDateRange();
  const { budgetSettings, updateDocument, loading: financeLoading } = useFinanceData(userUid, selectedRange.from, selectedRange.to);
  const { selectedCurrency, convertInputToUSD, convertUSDToSelected, setCurrency } = useCurrency();
  const { isDarkMode, toggleTheme } = useTheme();

  const navigate = useNavigate();

  useEffect(() => {
    if (budgetSettings && budgetSettings.id) {
      setMonthlyBudgetInput(convertUSDToSelected(budgetSettings.totalBudgeted || 0).toString());
      setMicroInvestingEnabled(budgetSettings.microInvestingEnabled ?? true);
      setMicroInvestingPercentage(budgetSettings.microInvestingPercentage?.toString() || '30');
      setPriceAlertThresholdInput(budgetSettings.priceAlertThreshold?.toString() || '5');
    }
  }, [budgetSettings, convertUSDToSelected]);

  useEffect(() => {
    if (user) {
      setDisplayNameInput(user.displayName || '');
      setNewEmailInput(user.email || ''); // Pre-fill with current email
    }
  }, [user]);

  // --- Firebase Account Management Handlers ---

  const handleUpdateName = useCallback(async () => {
    if (!user || !userUid) {
      toast.error(t("common.error"));
      return;
    }
    if (!displayNameInput.trim()) {
      toast.error(t("settings.nameRequired"));
      return;
    }

    setIsUpdatingName(true);
    try {
      await updateProfile(user, { displayName: displayNameInput.trim() });
      // Also update the 'users' collection document
      await setDoc(doc(db, "users", user.uid), { name: displayNameInput.trim() }, { merge: true });
      toast.success(t("settings.nameUpdateSuccess"));
    } catch (error: any) {
      console.error("Error updating display name:", error);
      toast.error(`${t("common.error")}: ${error.message}`);
    } finally {
      setIsUpdatingName(false);
    }
  }, [user, userUid, displayNameInput, t]);

  const handleChangeEmail = useCallback(async () => {
    if (!user || !user.email || !userUid) {
      toast.error(t("common.error"));
      return;
    }
    if (!newEmailInput.trim() || !/\S+@\S+\.\S+/.test(newEmailInput.trim())) {
      toast.error(t("settings.invalidEmail"));
      return;
    }
    if (!currentPasswordInput) {
      toast.error(t("settings.passwordRequired"));
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPasswordInput);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmailInput.trim());
      // Also update the 'users' collection document
      await setDoc(doc(db, "users", user.uid), { email: newEmailInput.trim() }, { merge: true });
      toast.success(t("settings.emailUpdateSuccess"));
      setShowChangeEmailModal(false);
      setCurrentPasswordInput(''); // Clear password
    } catch (error: any) {
      console.error("Error updating email:", error);
      let errorMessage = `${t("settings.emailUpdateError")}: ${error.message}`;
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = t("settings.reauthenticateRequired");
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = t("settings.invalidPassword");
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = t("settings.emailInUse");
      }
      toast.error(errorMessage);
    } finally {
      setIsUpdatingEmail(false);
    }
  }, [user, userUid, newEmailInput, currentPasswordInput, t]);

  const validatePassword = (password: string) => {
    if (password.length < 8) return t("settings.passwordTooShort");
    if (!/[A-Z]/.test(password)) return t("settings.passwordUppercase");
    if (!/[a-z]/.test(password)) return t("settings.passwordLowercase");
    if (!/[0-9]/.test(password)) return t("settings.passwordNumber");
    return null;
  };

  const handleChangePassword = useCallback(async () => {
    if (!user || !user.email) {
      toast.error(t("common.error"));
      return;
    }
    if (!currentPasswordInput) {
      toast.error(t("settings.passwordRequired"));
      return;
    }
    const newPasswordError = validatePassword(newPasswordInput);
    if (newPasswordError) {
      toast.error(newPasswordError);
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      toast.error(t("settings.passwordsMismatch"));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPasswordInput);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPasswordInput);
      toast.success(t("settings.passwordUpdateSuccess"));
      setShowChangePasswordModal(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
    } catch (error: any) {
      console.error("Error updating password:", error);
      let errorMessage = `${t("settings.passwordUpdateError")}: ${error.message}`;
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = t("settings.reauthenticateRequired");
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = t("settings.invalidPassword");
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t("settings.passwordTooWeak");
      }
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  }, [user, currentPasswordInput, newPasswordInput, confirmNewPasswordInput, t]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user || !userUid) {
      toast.error(t("common.error"));
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Re-authenticate if necessary (Firebase might require it for deleteUser)
      // For simplicity, we'll assume the user was recently logged in or re-authenticated for another action.
      // In a real app, you might prompt for password again here.
      await deleteUser(user);

      // Delete user data from Firestore
      const collectionsToDelete = [
        'accounts', 'budgetSettings', 'categories', 'goals',
        'investments', 'portfolioSnapshots', 'recurringTransactions', 'transactions', 'users'
      ];

      for (const collectionName of collectionsToDelete) {
        const q = query(collection(db, collectionName), where("ownerUid", "==", userUid));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, collectionName, d.id)));
        await Promise.all(deletePromises);
      }

      toast.success(t("settings.accountDeleteSuccess"));
      navigate('/login');
    } catch (error: any) {
      console.error("Error deleting account:", error);
      let errorMessage = `${t("settings.accountDeleteError")}: ${error.message}`;
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = t("settings.reauthenticateRequired");
      }
      toast.error(errorMessage);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountConfirm(false);
    }
  }, [user, userUid, navigate, t]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('selectedCurrency'); // Clear currency preference
      localStorage.removeItem('i18nextLng'); // Clear language preference
      localStorage.removeItem('selectedDateRange'); // Clear date range preference
      toast.success(t("settings.signOutSuccess"));
      setShowProfilePopup(false); // Close popup if open
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error(t("settings.signOutError"));
    }
  }, [navigate, setShowProfilePopup, t]);

  const handleConnectGoogle = useCallback(async () => {
    if (!user || !userUid) {
      toast.error(t("common.error"));
      return;
    }
    setIsConnectingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Link the Google account to the current user
      if (user.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID)) {
        toast.info(t("settings.googleAlreadyLinked"));
      } else {
        // If the user is already signed in with email/password, link the Google account
        // If the Google account is already linked to another user, Firebase will throw an error
        // For simplicity, we're assuming the user is not trying to link an already-linked Google account to a different email user.
        // A more robust solution would involve handling 'auth/credential-already-in-use'
        await (user as any).linkWithCredential((result as any).credential as AuthCredential); // Explicitly cast result to any
        await setDoc(doc(db, "users", user.uid), {
          name: result.user.displayName,
          email: result.user.email,
          avatar: result.user.photoURL,
          googleLinked: true,
        }, { merge: true }); // Use merge to avoid overwriting other fields
        toast.success(t("settings.googleLinkedSuccess"));
      }
    } catch (error: any) {
      console.error("Error connecting Google account:", error);
      let errorMessage = `${t("settings.googleLinkedError")}: ${error.message}`;
      if (error.code === 'auth/credential-already-in-use') {
        errorMessage = t("settings.googleCredentialInUse");
      }
      toast.error(errorMessage);
    } finally {
      setIsConnectingGoogle(false);
    }
  }, [user, userUid, t]);


  // --- Other Settings Handlers (existing) ---

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

  const isGoogleLinked = user?.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} onViewChange={handleViewChange} userUid={userUid} setShowProfilePopup={setShowProfilePopup} />

      <div className={`flex flex-col flex-1 min-w-0 ${sidebarOpen ? 'sm:ml-72' : 'sm:ml-0'} transition-all duration-300 ease-in-out`}>
        <Header
          title={t("navigation.settings")}
          onSidebarToggle={handleSidebarToggle}
          setShowProfilePopup={setShowProfilePopup}
        />

        <main className="min-h-screen bg-background/40 md:bg-background p-3 sm:p-4 lg:p-6 pt-16 pb-20"> {/* Applied global layout polish */}
          <div className="max-w-6xl mx-auto w-full space-y-4"> {/* Applied max-width container */}
            {/* Account Info */}
            <Card className="glassmorphic-card"> {/* Applied consistent card style */}
              <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight"> {/* Applied consistent typography */}
                  <UserCircle className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.accountInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-5 lg:p-6 pt-0 divide-y divide-border/10"> {/* Applied consistent padding and divider */}
                <div className="grid gap-2 py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="display-name" className="text-sm sm:text-base">{t("settings.changeName")}</Label> {/* Applied consistent typography */}
                  <Input
                    id="display-name"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder={t("settings.namePlaceholder")}
                    className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
                    disabled={isUpdatingName}
                  />
                  <Button onClick={handleUpdateName} className="w-full" disabled={isUpdatingName}>
                    {isUpdatingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserIcon className="w-4 h-4 mr-2" />}
                    {t("common.save")} {t("settings.name")}
                  </Button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => setShowChangeEmailModal(true)}
                >
                  {t("settings.changeEmail")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => setShowChangePasswordModal(true)}
                >
                  {t("settings.changePassword")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <div className="flex items-center justify-between py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="2fa-toggle" className="flex items-center text-sm sm:text-base cursor-pointer"> {/* Applied consistent typography */}
                    <ShieldCheck className="w-5 h-5 mr-2 text-muted-foreground" />
                    {t("settings.enableTwoFactorAuth")}
                  </Label>
                  <Switch id="2fa-toggle" checked={false} onCheckedChange={() => toast.info(t("common.comingSoon"))} />
                </div>
                <AlertDialog open={showDeleteAccountConfirm} onOpenChange={setShowDeleteAccountConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg" disabled={isDeletingAccount}> {/* Applied consistent typography and padding */}
                      {isDeletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                      {t("settings.deleteAccount")}
                    </Button>
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
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all" {/* Applied consistent typography and padding */}
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" /> {t("settings.signOut")}
                </motion.button>
              </CardContent>
            </Card>

            {/* Connect Google Account */}
            <Card className="glassmorphic-card"> {/* Applied consistent card style */}
              <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight"> {/* Applied consistent typography */}
                  <LinkIcon className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.socialConnections")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-5 lg:p-6 pt-0"> {/* Applied consistent padding */}
                <Button
                  className="w-full flex justify-between items-center text-sm sm:text-base px-4 py-3 rounded-lg" {/* Applied consistent typography and padding */}
                  onClick={handleConnectGoogle}
                  disabled={isConnectingGoogle || isGoogleLinked}
                >
                  <div className="flex items-center">
                    {isConnectingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <img src="/icons/google.svg" alt="Google" className="w-5 h-5 mr-2" />}
                    {isGoogleLinked ? t("settings.googleAccountLinked") : t("settings.connectGoogleAccount")}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>

            {/* Budget Settings */}
            <Card className="glassmorphic-card"> {/* Applied consistent card style */}
              <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight"> {/* Applied consistent typography */}
                  <DollarSign className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.budget")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-5 lg:p-6 pt-0 divide-y divide-border/10"> {/* Applied consistent padding and divider */}
                <div className="grid gap-2 py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="monthly-budget" className="text-sm sm:text-base">{t("settings.monthlyBudget")}</Label> {/* Applied consistent typography */}
                  <Input
                    id="monthly-budget"
                    type="number"
                    step="0.01"
                    value={monthlyBudgetInput}
                    onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                    placeholder={`${selectedCurrency.symbol} 3000.00`}
                    className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
                  />
                  <Button onClick={handleSaveMonthlyBudget} className="w-full">
                    {t("settings.saveMonthlyBudget")}
                  </Button>
                </div>
                <div className="grid gap-2 py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="default-budget-period" className="text-sm sm:text-base">{t("settings.defaultBudgetPeriod")}</Label> {/* Applied consistent typography */}
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
                <div className="flex items-center justify-between py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="rollover-toggle" className="flex items-center text-sm sm:text-base cursor-pointer"> {/* Applied consistent typography */}
                    <ArrowRight className="w-5 h-5 mr-2 text-muted-foreground" />
                    {t("settings.autoRolloverBudgets")}
                  </Label>
                  <Switch
                    id="rollover-toggle"
                    checked={budgetSettings.rolloverEnabled}
                    onCheckedChange={(checked) => updateDocument('budgetSettings', budgetSettings.id, { rolloverEnabled: checked })}
                  />
                </div>
                <div className="grid gap-2 py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="micro-investing-percentage" className="text-sm sm:text-base"> {/* Applied consistent typography */}
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
                  <Button onClick={handleSaveMicroInvestingSettings} className="w-full">
                    {t("settings.saveMicroInvestingSettings")}
                  </Button>
                </div>
                <div className="grid gap-2 py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="price-alert-threshold" className="text-sm sm:text-base"> {/* Applied consistent typography */}
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
                  <Button onClick={handleSavePriceAlertThreshold} className="w-full">
                    {t("settings.saveAlertThreshold")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="glassmorphic-card"> {/* Applied consistent card style */}
              <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight"> {/* Applied consistent typography */}
                  <Database className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.dataManagement")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-5 lg:p-6 pt-0 divide-y divide-border/10"> {/* Applied consistent padding and divider */}
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Upload className="w-5 h-5 mr-2" /> {t("settings.importCSV")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Download className="w-5 h-5 mr-2" /> {t("settings.exportCSVAdvanced")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Database className="w-5 h-5 mr-2" /> {t("settings.backupData")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Download className="w-5 h-5 mr-2" /> {t("settings.restoreFromBackup")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </CardContent>
            </Card>

            {/* Localization */}
            <Card className="glassmorphic-card"> {/* Applied consistent card style */}
              <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight"> {/* Applied consistent typography */}
                  <Globe className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.localization")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-5 lg:p-6 pt-0 divide-y divide-border/10"> {/* Applied consistent padding and divider */}
                <div className="grid gap-2 py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="default-currency-settings" className="text-sm sm:text-base">{t("settings.defaultCurrency")}</Label> {/* Applied consistent typography */}
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
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <Clock className="w-5 h-5 mr-2" /> {t("settings.regionTimezone")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <div className="grid gap-2 py-3"> {/* Added py-3 for consistent spacing */}
                  <Label htmlFor="app-language-settings" className="text-sm sm:text-base">{t("settings.appLanguage")}</Label> {/* Applied consistent typography */}
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
            <Card className="glassmorphic-card"> {/* Applied consistent card style */}
              <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight"> {/* Applied consistent typography */}
                  <Key className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.apiIntegrations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-5 lg:p-6 pt-0"> {/* Applied consistent padding */}
                <p className="text-xs sm:text-sm text-muted-foreground mb-4"> {/* Applied consistent typography */}
                  {t("settings.apiIntegrationsDescription")}
                </p>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  <LinkIcon className="w-5 h-5 mr-2" /> {t("settings.bankConnections")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card className="glassmorphic-card"> {/* Applied consistent card style */}
              <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight"> {/* Applied consistent typography */}
                  <Info className="w-5 h-5 mr-2 text-muted-foreground" /> {t("settings.privacy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-5 lg:p-6 pt-0 divide-y divide-border/10"> {/* Applied consistent padding and divider */}
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.gdprNotice")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.privacyPolicy")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg hover:bg-muted/50 transition-all" {/* Applied consistent typography and padding */}
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {t("settings.termsOfService")} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <AlertDialog open={isDeleteDataConfirmOpen} onOpenChange={setIsDeleteDataConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full flex justify-between items-center text-sm sm:text-base px-0 py-3 rounded-lg"> {/* Applied consistent typography and padding */}
                      <Trash2 className="w-5 h-5 mr-2" /> {t("settings.deleteAllPersonalData")}
                    </Button>
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

      {/* Change Email Modal */}
      <Dialog open={showChangeEmailModal} onOpenChange={setShowChangeEmailModal}>
        <DialogContent className="sm:max-w-[425px] glassmorphic-card">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AtSign className="w-5 h-5 mr-2" /> {t("settings.changeEmail")}
            </DialogTitle>
            <DialogDescription>{t("settings.changeEmailDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-email" className="text-right">{t("settings.newEmail")}</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                placeholder="new@example.com"
                className="col-span-3 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
                disabled={isUpdatingEmail}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-password-email" className="text-right">{t("settings.currentPassword")}</Label>
              <div className="col-span-3 relative">
                <Input
                  id="current-password-email"
                  type={showPassword ? "text" : "password"}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] pr-10"
                  disabled={isUpdatingEmail}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowChangeEmailModal(false)} className="flex-1 sm:flex-none">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleChangeEmail} className="flex-1 sm:flex-none" disabled={isUpdatingEmail}>
              {isUpdatingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="sm:max-w-[425px] glassmorphic-card">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <KeyRound className="w-5 h-5 mr-2" /> {t("settings.changePassword")}
            </DialogTitle>
            <DialogDescription>{t("settings.changePasswordDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-password-pw" className="text-right">{t("settings.currentPassword")}</Label>
              <div className="col-span-3 relative">
                <Input
                  id="current-password-pw"
                  type={showPassword ? "text" : "password"}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] pr-10"
                  disabled={isUpdatingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">{t("settings.newPassword")}</Label>
              <div className="col-span-3 relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] pr-10"
                  disabled={isUpdatingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirm-new-password" className="text-right">{t("settings.confirmNewPassword")}</Label>
              <div className="col-span-3 relative">
                <Input
                  id="confirm-new-password"
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={confirmNewPasswordInput}
                  onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] pr-10"
                  disabled={isUpdatingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowChangePasswordModal(false)} className="flex-1 sm:flex-none">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleChangePassword} className="flex-1 sm:flex-none" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;