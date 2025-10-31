"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, DollarSign, Globe, LogOut, FileText, Check, X, Wifi, WifiOff, Loader2, AlertCircle,
  User as UserIcon, Settings as SettingsIcon, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useCurrency, CURRENCIES } from '@/context/CurrencyContext';
import { useFirestoreStatus } from '@/hooks/use-firestore-status';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { exportAllUserData } from '@/lib/data-export'; // New utility for export
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeviceDetection } from '@/hooks/use-device-detection';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CardContent } from '@/components/ui/card'; // Import CardContent

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userUid } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { selectedCurrency, setCurrency } = useCurrency();
  const { status: syncStatus, lastSyncTime, error: syncError } = useFirestoreStatus(userUid);
  const { isMobile } = useDeviceDetection();

  const popupRef = useRef<HTMLDivElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userDisplayName = user?.displayName || t("common.guest");
  const userEmail = user?.email || t("common.notLoggedIn");
  const userInitials = userDisplayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('selectedCurrency'); // Clear currency preference
      localStorage.removeItem('i18nextLng'); // Clear language preference
      localStorage.removeItem('selectedDateRange'); // Clear date range preference
      toast.success(t("settings.signOutSuccess"));
      onClose();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error(t("settings.signOutError"));
    } finally {
      setShowLogoutConfirm(false);
    }
  }, [onClose, navigate, t]);

  const handleLanguageChange = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    toast.success(t("common.success"));
  }, [t]);

  const handleExportData = useCallback(async () => {
    if (!userUid) {
      toast.error(t("common.error"));
      return;
    }
    try {
      await exportAllUserData(userUid);
      toast.success(t("settings.exportDataSuccess"));
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error(t("settings.exportDataError"));
    }
  }, [userUid, t]);

  let syncIcon;
  let syncColorClass;
  let syncTooltipText;

  switch (syncStatus) {
    case 'synced':
      syncIcon = <Wifi className="h-4 w-4" />;
      syncColorClass = 'text-emerald';
      syncTooltipText = syncStatus === 'synced' && lastSyncTime ? t("syncStatus.syncedLast", { time: formatDistanceToNowStrict(lastSyncTime, { addSuffix: true }) }) : t("syncStatus.synced");
      break;
    case 'offline':
      syncIcon = <WifiOff className="h-4 w-4" />;
      syncColorClass = 'text-muted-foreground';
      syncTooltipText = t("syncStatus.offline");
      break;
    case 'syncing':
      syncIcon = <Loader2 className="h-4 w-4 animate-spin" />;
      syncColorClass = 'text-primary';
      syncTooltipText = t("syncStatus.syncing");
      break;
    case 'error':
      syncIcon = <AlertCircle className="h-4 w-4" />;
      syncColorClass = 'text-destructive';
      syncTooltipText = t("syncStatus.error", { message: syncError || t("syncStatus.unknownError") });
      break;
    default:
      syncIcon = <WifiOff className="h-4 w-4" />;
      syncColorClass = 'text-muted-foreground';
      syncTooltipText = t("syncStatus.offline");
  }

  const content = (
    <CardContent className="p-4 sm:p-5 lg:p-6 w-full max-w-xs space-y-4"> {/* Applied consistent padding */}
      {/* User Info */}
      <div className="flex items-center space-x-3 pb-3 border-b border-border/10"> {/* Applied consistent divider */}
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-lilac rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
          {userInitials}
        </div>
        <div className="min-w-0"> {/* Added min-w-0 */}
          <p className="font-semibold text-sm truncate">{userDisplayName}</p> {/* Applied consistent typography and truncate */}
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p> {/* Applied consistent typography and truncate */}
        </div>
      </div>

      {/* Quick Preferences */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-semibold uppercase text-muted-foreground">{t("profilePopup.quickPreferences")}</h3> {/* Applied consistent typography */}
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-dark-mode-toggle" className="flex items-center text-sm cursor-pointer min-w-0"> {/* Applied consistent typography and min-w-0 */}
            {isDarkMode ? <Moon className="w-4 h-4 mr-2 flex-shrink-0" /> : <Sun className="w-4 h-4 mr-2 flex-shrink-0" />}
            <span className="truncate">{t("settings.darkMode")}</span> {/* Added truncate */}
          </Label>
          <Switch
            id="profile-dark-mode-toggle"
            checked={isDarkMode}
            onCheckedChange={toggleTheme}
          />
        </div>

        {/* Language Selector */}
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-app-language" className="flex items-center text-sm min-w-0"> {/* Applied consistent typography and min-w-0 */}
            <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{t("settings.appLanguage")}</span> {/* Added truncate */}
          </Label>
          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
              <SelectValue placeholder={t("settings.selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English 🇬🇧</SelectItem>
              <SelectItem value="mk">Македонски 🇲🇰</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-main-currency" className="flex items-center text-sm min-w-0"> {/* Applied consistent typography and min-w-0 */}
            <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{t("settings.mainCurrency")}</span> {/* Added truncate */}
          </Label>
          <Select value={selectedCurrency.code} onValueChange={setCurrency}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
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

        {/* Sync Status Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between cursor-help">
              <Label className="flex items-center text-sm min-w-0"> {/* Applied consistent typography and min-w-0 */}
                <Check className="w-4 h-4 mr-2 text-emerald flex-shrink-0" />
                <span className="truncate">{t("profilePopup.syncStatus")}</span> {/* Added truncate */}
              </Label>
              <div className={cn("flex items-center space-x-1 text-xs flex-shrink-0", syncColorClass)}> {/* Applied consistent typography */}
                {syncIcon}
                <span>{syncStatus === 'synced' ? t("syncStatus.synced") : t("syncStatus.offline")}</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-tooltip-bg border-tooltip-border-color text-tooltip-text-color">
            <p className="text-sm">{syncTooltipText}</p> {/* Applied consistent typography */}
          </TooltipContent>
        </Tooltip>

        {/* Export Data */}
        <Button variant="ghost" onClick={handleExportData} className="w-full justify-start text-sm px-2 py-2 h-auto"> {/* Applied consistent typography */}
          <FileText className="w-4 h-4 mr-2 flex-shrink-0" /> <span className="min-w-0 truncate">{t("settings.exportData")}</span> {/* Added min-w-0 and truncate */}
        </Button>
      </div>

      <Separator />

      {/* Account Actions */}
      <div className="space-y-2">
        <h3 className="text-xs sm:text-sm font-semibold uppercase text-muted-foreground">{t("profilePopup.account")}</h3> {/* Applied consistent typography */}
        <Link to="/settings" onClick={onClose} className="flex items-center justify-between w-full text-sm px-2 py-2 h-auto hover:bg-muted/50 rounded-md transition-colors"> {/* Applied consistent typography */}
          <div className="flex items-center space-x-2 min-w-0"> {/* Added min-w-0 */}
            <SettingsIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t("profilePopup.manageAccount")}</span> {/* Added truncate */}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </Link>
        <Button variant="ghost" onClick={() => setShowLogoutConfirm(true)} className="w-full justify-start text-sm px-2 py-2 h-auto text-destructive"> {/* Applied consistent typography */}
          <LogOut className="w-4 h-4 mr-2 flex-shrink-0" /> <span className="min-w-0 truncate">{t("settings.signOut")}</span> {/* Added min-w-0 and truncate */}
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="glassmorphic-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.signOutConfirmationTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.signOutConfirmationDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  );

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="safe-top safe-bottom glassmorphic-card">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center">
              <UserIcon className="w-5 h-5 mr-2" /> {t("profilePopup.yourProfile")}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end items-start p-4 sm:p-6 pointer-events-none">
          <div className="relative pointer-events-auto">
            {content}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePopup;