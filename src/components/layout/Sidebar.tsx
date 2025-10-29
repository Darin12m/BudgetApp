"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, DollarSign, List, Wallet, Settings, Bell, X, Target, UserCircle } from 'lucide-react'; // Added UserCircle
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion'; // Import motion

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: string) => void;
  userUid: string | null;
  setShowProfilePopup: (show: boolean) => void; // New prop
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onViewChange, setShowProfilePopup }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: t("navigation.dashboard"), icon: Home, path: '/' },
    { id: 'transactions', label: t("navigation.transactions"), icon: List, path: '/budget-app?view=transactions' },
    { id: 'budget', label: t("navigation.budget"), icon: DollarSign, path: '/budget-app?view=budget' },
    { id: 'goals', label: t("navigation.goals"), icon: Target, path: '/budget-app?view=goals' },
    { id: 'investments', label: t("navigation.investments"), icon: Wallet, path: '/investments' },
  ];

  const userDisplayName = user?.displayName || "John Doe";
  const userEmail = user?.email || "john@example.com";
  const userInitials = userDisplayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full glassmorphic-card transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 sm:w-72 flex flex-col rounded-none border-r`}>
        <div className="flex flex-col h-full">
          <div className="p-5 sm:p-6 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <h1 className="h2 font-bold bg-gradient-to-r from-primary to-lilac bg-clip-text text-transparent tracking-tight">
                FinanceFlow
              </h1>
              <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-lg active:bg-muted sm:hidden">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* User Profile Card - now triggers ProfilePopup */}
            <motion.button
              whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-sm)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowProfilePopup(true); onClose(); }}
              className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl hover:bg-muted active:bg-muted/70 transition-colors duration-200 w-full text-left"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-lilac rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {userInitials}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{userDisplayName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </motion.button>
          </div>

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = (item.path === location.pathname + location.search) || (item.id === 'dashboard' && location.pathname === '/');

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => { onViewChange(item.id); onClose(); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 active:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-primary dark:bg-primary rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Removed Bottom Navigation Icons (Settings, Notifications) - now in ProfilePopup */}
          <div className="mt-auto p-4 border-t border-border flex justify-center space-x-4">
            {/* Placeholder for future bottom items if needed, currently empty as per refactor */}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300 sm:hidden"
          onClick={onClose}
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
        />
      )}
    </>
  );
};

export default Sidebar;