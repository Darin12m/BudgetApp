"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, DollarSign, List, Wallet, Settings, Bell, X, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Add this import

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: string) => void;
  userUid: string | null; // Keep userUid if needed for future user-specific sidebar content
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onViewChange }) => {
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'transactions', label: 'Transactions', icon: List, path: '/budget-app?view=transactions' },
    { id: 'budget', label: 'Budget', icon: DollarSign, path: '/budget-app?view=budget' },
    { id: 'goals', label: 'Goals', icon: Target, path: '/budget-app?view=goals' },
    { id: 'investments', label: 'Investments', icon: Wallet, path: '/investments' },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-card backdrop-blur-lg border-r border-border transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 sm:w-72 card-shadow flex flex-col`}> {/* Added flex-col here */}
        <div className="flex flex-col h-full">
          <div className="p-5 sm:p-6 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-lilac bg-clip-text text-transparent">
                FinanceFlow
              </h1>
              <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-lg active:bg-muted sm:hidden">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-lilac rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">John Doe</p>
                <p className="text-xs text-muted-foreground">john@example.com</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto"> {/* Added flex-1 and overflow-y-auto */}
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

          {/* Bottom Navigation Icons */}
          <div className="mt-auto p-4 border-t border-border flex justify-center space-x-4">
            {/* Settings Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  onClick={() => { onViewChange('settings'); onClose(); }}
                  className="group relative flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-primary transition-all duration-200"
                >
                  <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-primary/10 transition-all duration-200"></div>
                  <Settings className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="bg-tooltip-bg border-tooltip-border-color text-tooltip-text-color">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { toast.info("Notifications feature coming soon!"); onClose(); }}
                  className="group relative flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-primary transition-all duration-200"
                >
                  <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-primary/10 transition-all duration-200"></div>
                  <Bell className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-tooltip-bg border-tooltip-border-color text-tooltip-text-color">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300 sm:hidden"
          onClick={onClose}
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
        />
      )}
    </>
  );
};

export default Sidebar;