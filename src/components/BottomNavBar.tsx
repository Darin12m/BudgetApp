"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, DollarSign, List, Wallet, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

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
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 glassmorphic-card border-t z-40 safe-bottom transition-colors duration-300 rounded-none">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = (item.path === location.pathname + location.search) || (item.id === 'home' && location.pathname === '/') || (item.id === 'investments' && location.pathname === '/investments') || (item.id === 'settings' && location.pathname === '/settings');
          return (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all"
            >
              <Link
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  isActive ? 'text-primary dark:text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-indicator"
                  className="absolute bottom-0 w-8 h-1 bg-primary dark:bg-primary rounded-t-full"
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