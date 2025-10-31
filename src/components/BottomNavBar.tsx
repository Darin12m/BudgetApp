"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, DollarSign, List, Wallet, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Import cn

const BottomNavBar: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const location = useLocation();

  const navItems = [
    { id: 'home', label: t("navigation.home"), icon: Home, path: '/' },
    { id: 'budget', label: t("navigation.budget"), icon: DollarSign, path: '/budget-app?view=budget' },
    { id: 'transactions', label: t("navigation.activity"), icon: List, path: '/budget-app?view=transactions' },
    { id: 'investments', label: t("navigation.investments"), icon: Wallet, path: '/investments' },
    { id: 'settings', label: t("navigation.settings"), icon: Settings, path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-background/70 backdrop-blur-xl border border-white/10 px-3 py-2 shadow-lg max-w-md w-[92%] sm:w-auto"> {/* Toned down bottom nav */}
      <div className="grid grid-cols-5 gap-1 w-full"> {/* Ensure grid takes full width */}
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = (item.path === location.pathname + location.search) || (item.id === 'home' && location.pathname === '/') || (item.id === 'investments' && location.pathname === '/investments') || (item.id === 'settings' && location.pathname === '/settings');
          return (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="relative flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all" // Adjusted padding and rounded-full
            >
              <Link
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  isActive ? 'text-primary dark:text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} /> {/* Smaller icon, less margin */}
                <span className={`text-[0.6rem] leading-none ${isActive ? 'font-semibold' : 'font-medium'} hidden sm:block`}> {/* Smaller text, hidden on mobile */}
                  {item.label}
                </span>
              </Link>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-indicator"
                  className="absolute bottom-0 w-6 h-0.5 bg-primary dark:bg-primary rounded-t-full" // Smaller indicator
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;