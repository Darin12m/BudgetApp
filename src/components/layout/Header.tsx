"use client";

import React from 'react';
import { Menu } from 'lucide-react';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion'; // Import motion

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSidebarToggle: () => void;
  setShowProfilePopup: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onSidebarToggle, setShowProfilePopup }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const userDisplayName = user?.displayName || t("common.guest");
  const userInitials = userDisplayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <header className="glassmorphic-card sticky top-0 z-40 safe-top transition-colors duration-300 rounded-none border-b">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSidebarToggle}
            className="p-2 hover:bg-muted/50 rounded-lg transition-colors active:bg-muted flex-shrink-0"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h2 className="h3 capitalize truncate">{title}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <DateRangePicker />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfilePopup(true)}
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-lilac rounded-full flex items-center justify-center text-white font-semibold text-sm",
              "transition-all duration-150 hover:scale-105 hover:opacity-90 active:scale-95"
            )}
            aria-label={t("profilePopup.openProfile")}
          >
            {userInitials}
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;