"use client";

import React, { createContext, useContext, useState, useLayoutEffect, useCallback, ReactNode } from 'react';

// Define the structure for a currency
interface Currency {
  code: string; // e.g., "USD", "MKD", "EUR"
  symbol: string; // e.g., "$", "ден", "€"
  conversionRateToUSD: number; // How many USD 1 unit of this currency is worth (e.g., for MKD, 1 MKD = 1/57 USD)
}

// List of available currencies with placeholder conversion rates
const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', conversionRateToUSD: 1 },
  { code: 'MKD', symbol: 'ден', conversionRateToUSD: 1 / 57 }, // 1 USD = 57 MKD
  { code: 'EUR', symbol: '€', conversionRateToUSD: 1.08 }, // 1 EUR = 1.08 USD (placeholder)
  { code: 'GBP', symbol: '£', conversionRateToUSD: 1.27 }, // 1 GBP = 1.27 USD (placeholder)
  { code: 'JPY', symbol: '¥', conversionRateToUSD: 1 / 158 }, // 1 JPY = 1/158 USD (placeholder)
];

// Find the default USD currency object
const USD_CURRENCY = CURRENCIES.find(c => c.code === 'USD')!;

// Define the shape of the context value
interface CurrencyContextType {
  selectedCurrency: Currency;
  setCurrency: (currencyCode: string) => void;
  formatCurrency: (valueInUSD: number, options?: Intl.NumberFormatOptions) => string;
}

// Create the context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// CurrencyProvider component
export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(USD_CURRENCY);

  // Use useLayoutEffect to read from localStorage before the first render
  useLayoutEffect(() => {
    const savedCurrencyCode = localStorage.getItem('selectedCurrency');
    if (savedCurrencyCode) {
      const foundCurrency = CURRENCIES.find(c => c.code === savedCurrencyCode);
      if (foundCurrency) {
        setSelectedCurrency(foundCurrency);
      } else {
        // If saved currency is not in our list, default to USD
        setSelectedCurrency(USD_CURRENCY);
        localStorage.setItem('selectedCurrency', USD_CURRENCY.code);
      }
    } else {
      // If no currency is saved, default to USD and save it
      setSelectedCurrency(USD_CURRENCY);
      localStorage.setItem('selectedCurrency', USD_CURRENCY.code);
    }
  }, []);

  // Function to change the currency and save to localStorage
  const setCurrency = useCallback((currencyCode: string) => {
    const newCurrency = CURRENCIES.find(c => c.code === currencyCode);
    if (newCurrency) {
      setSelectedCurrency(newCurrency);
      localStorage.setItem('selectedCurrency', newCurrency.code);
    }
  }, []);

  // Function to format currency values
  const formatCurrency = useCallback((valueInUSD: number, options?: Intl.NumberFormatOptions): string => {
    // Convert USD value to the selected currency's value
    const valueInSelectedCurrency = valueInUSD / selectedCurrency.conversionRateToUSD;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: 2,
      ...options,
    }).format(valueInSelectedCurrency);
  }, [selectedCurrency]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use the currency context
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export { CURRENCIES };