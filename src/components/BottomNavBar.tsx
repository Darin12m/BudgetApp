"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, DollarSign, List, Wallet, Settings } from 'lucide-react';

const BottomNavBar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'budget', label: 'Budget', icon: DollarSign, path: '/budget-app?view=budget' },
    { id: 'transactions', label: 'Activity', icon: List, path: '/budget-app?view=transactions' },
    { id: 'investments', label: 'Investments', icon: Wallet, path: '/investments' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }, // Placeholder for settings
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = (item.path === location.pathname + location.search) || (item.id === 'home' && location.pathname === '/') || (item.id === 'investments' && location.pathname === '/investments');
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all active:scale-95 ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;