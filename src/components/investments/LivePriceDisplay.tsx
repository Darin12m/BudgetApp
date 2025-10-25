"use client";

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency

interface LivePriceDisplayProps {
  price: number | null;
  loading: boolean;
  error: string | null;
}

const LivePriceDisplay: React.FC<LivePriceDisplayProps> = ({ price, loading, error }) => {
  const { formatCurrency } = useCurrency(); // Use formatCurrency from context

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span>Fetching live price...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-xs">{error}</p>;
  }

  if (price === null || price === 0) {
    return <p className="text-muted-foreground text-xs">Price not available.</p>;
  }

  return (
    <div className="flex items-center space-x-2 text-sm font-medium text-arrowUp">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-arrowUp/40 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-arrowUp"></span>
      </span>
      <span>{formatCurrency(price)}</span>
    </div>
  );
};

export default LivePriceDisplay;