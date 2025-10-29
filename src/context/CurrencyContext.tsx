"use client";

import React, { createContext, useContext, useState, useLayoutEffect, useCallback, ReactNode } from 'react';

// Define the structure for a currency
interface Currency {
  code: string; // e.g., "USD", "MKD", "EUR"
  symbol: string; // e.g., "$", "ден", "€"
  conversionRateToUSD: number; // How many USD 1 unit of this currency is worth (e.g., for MKD, 1 MKD = 1/57 USD)
}

// IMPORTANT: These conversion rates are static placeholders.
// For a production application, these should be fetched periodically from a reliable
// foreign exchange (forex) API (e.g., Open Exchange Rates, Fixer.io) and stored
// server-side (e.g., in Firebase Functions or a database) to ensure accuracy.
// Client-side fetching of real-time rates is generally not recommended due to
// API key exposure and rate limit management.
const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', conversionRateToUSD: 1 },
  { code: 'MKD', symbol: 'ден', conversionRateToUSD: 1 / 57 }, // 1 USD = 57 MKD (placeholder rate)
  { code: 'EUR', symbol: '€', conversionRateToUSD: 1.08 }, // 1 EUR = 1.08 USD (placeholder rate)
  { code: 'GBP', symbol: '£', conversionRateToUSD: 1.27 }, // 1 GBP = 1.27 USD (placeholder rate)
  { code: 'JPY', symbol: '¥', conversionRateToUSD: 1 / 158 }, // 1 JPY = 1/158 USD (placeholder rate)
];

// Find the default MKD currency object, fallback to USD if MKD is not found (shouldn't happen with static list)
const MKD_CURRENCY = CURRENCIES.find(c => c.code === 'MKD') || CURRENCIES.find(c => c.code === 'USD')!;

// Define the shape of the context value
interface CurrencyContextType {
  selectedCurrency: Currency;
  setCurrency: (currencyCode: string) => void;
  formatCurrency: (valueInUSD: number, options?: Intl.NumberFormatOptions) => string;
  formatUSD: (valueInUSD: number, options?: Intl.NumberFormatOptions) => string; // New function for explicit USD formatting
  convertInputToUSD: (value: number) => number; // New: Converts value from selectedCurrency to USD
  convertUSDToSelected: (valueInUSD: number) => number; // New: Converts USD value to selectedCurrency
  formatCurrencySymbolOnly: (valueInUSD: number, options?: Intl.NumberFormatOptions) => string; // New: Formats with symbol only
}

// Create the context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// CurrencyProvider component
export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(MKD_CURRENCY); // Default to MKD

  // Use useLayoutEffect to read from localStorage before the first render
  useLayoutEffect(() => {
    const savedCurrencyCode = localStorage.getItem('selectedCurrency');
    const mkdCurrency = CURRENCIES.find(c => c.code === 'MKD') || CURRENCIES.find(c => c.code === 'USD')!;

    if (savedCurrencyCode === mkdCurrency.code) {
      setSelectedCurrency(mkdCurrency);
    } else {
      // Always default to MKD and save it
      setSelectedCurrency(mkdCurrency);
      localStorage.setItem('selectedCurrency', mkdCurrency.code);
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

  // Function to format currency values based on selectedCurrency
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

  // New function to explicitly format in USD
  const formatUSD = useCallback((valueInUSD: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      ...options,
    }).format(valueInUSD);
  }, []);

  // New function to format currency with only the symbol
  const formatCurrencySymbolOnly = useCallback((valueInUSD: number, options?: Intl.NumberFormatOptions): string => {
    const valueInSelectedCurrency = valueInUSD / selectedCurrency.conversionRateToUSD;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      currencyDisplay: 'symbol', // Display only the symbol
      minimumFractionDigits: 2,
      ...options,
    }).format(valueInSelectedCurrency);
  }, [selectedCurrency]);

  // New: Converts a value (assumed to be in selectedCurrency) to USD
  const convertInputToUSD = useCallback((value: number): number => {
    return value * selectedCurrency.conversionRateToUSD;
  }, [selectedCurrency]);

  // New: Converts a USD value to the selected currency's value (number)
  const convertUSDToSelected = useCallback((valueInUSD: number): number => {
    return valueInUSD / selectedCurrency.conversionRateToUSD;
  }, [selectedCurrency]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setCurrency, formatCurrency, formatUSD, convertInputToUSD, convertUSDToSelected, formatCurrencySymbolOnly }}>
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