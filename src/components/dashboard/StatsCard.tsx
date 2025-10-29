"use client";

import React, { memo } from 'react';
import { TrendingUp, LucideIcon } from 'lucide-react';
import { Account } from '@/hooks/use-finance-data';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  trend?: { value: string; color: string };
  accounts: Account[];
}

const StatsCard: React.FC<StatsCardProps> = memo(({ title, value, subtitle, icon: Icon, color, bgColor, trend, accounts }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  return (
    <motion.div
      className="glassmorphic-card p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground font-mono tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
          {trend && (
            <p className={`text-xs ${trend.color} mt-1 flex items-center font-mono`}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend.value}
            </p>
          )}
        </div>
        <div className="hidden sm:flex w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: bgColor }}>
          <div style={{ color }}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
      {trend && (
        <div className="text-xs text-muted-foreground flex items-center mt-2">
          <div className="w-2 h-2 bg-emerald rounded-full mr-2 animate-pulse"></div>
          {t("dashboard.autoUpdated")} {accounts.length > 0 ? accounts[0].lastUpdated : 'N/A'}
        </div>
      )}
    </motion.div>
  );
});

export default StatsCard;