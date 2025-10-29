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

// Define the shape of the context value
interface CurrencyContextType {
  selectedCurrency: Currency;
  setCurrency: (currencyCode: string) => void;
  formatCurrency: (valueInUSD: number, options?: Intl.NumberFormatOptions) => string;
  formatUSD: (valueInUSD: number, options?: Intl.NumberFormatOptions) => string; // New function for explicit USD formatting
  convertInputToUSD: (value: number) => number; // New: Converts value from selectedCurrency to USD
  convertUSDToSelected: (valueInUSD: number) => number; // New: Converts USD value to selectedCurrency
  formatCurrencySymbolOnly: (valueInUSD: number, options?: Intl.NumberFormatOptions) => string; // New: Formats with symbol only
  formatCurrencyValueSymbol: (valueInUSD: number, options?: Intl.NumberFormatOptions) => string; // New: Formats as 'Value Symbol'
  formatCurrencyToParts: (valueInUSD: number, options?: Intl.NumberFormatOptions) => { symbol: string; value: string; }; // New: Formats into symbol and value parts
}

// Create the context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Helper to detect currency based on browser locale
const detectCurrency = (): Currency => {
  if (typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length > 0) {
    const userLocale = navigator.languages[0]; // e.g., "en-US", "mk-MK"

    // Prioritize MKD for North Macedonia locale
    if (userLocale.includes('mk')) {
      const mkd = CURRENCIES.find(c => c.code === 'MKD');
      if (mkd) return mkd;
    }

    // Try to match currency based on locale
    try {
      const formatter = new Intl.NumberFormat(userLocale, { style: 'currency', currency: 'USD' }); // Use USD as a base to get the default currency code for the locale
      const parts = formatter.formatToParts(0);
      const currencyCodePart = parts.find(p => p.type === 'currency');
      if (currencyCodePart) {
        const detectedCode = currencyCodePart.value;
        const matchedCurrency = CURRENCIES.find(c => c.code === detectedCode);
        if (matchedCurrency) return matchedCurrency;
      }
    } catch (e) {
      console.warn("Could not detect currency from locale:", e);
    }
  }
  // Fallback to USD if detection fails or no specific locale match
  return CURRENCIES.find(c => c.code === 'USD')!;
};


// CurrencyProvider component
export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES.find(c => c.code === 'USD')!); // Default to USD

  // Use useLayoutEffect to read from localStorage or detect before the first render
  useLayoutEffect(() => {
    const savedCurrencyCode = localStorage.getItem('selectedCurrency');
    if (savedCurrencyCode) {
      const savedCurrency = CURRENCIES.find(c => c.code === savedCurrencyCode);
      if (savedCurrency) {
        setSelectedCurrency(savedCurrency);
      } else {
        // If saved currency is not in our list, default to detected or USD
        const detected = detectCurrency();
        setSelectedCurrency(detected);
        localStorage.setItem('selectedCurrency', detected.code);
      }
    } else {
      // No saved currency, detect and save
      const detected = detectCurrency();
      setSelectedCurrency(detected);
      localStorage.setItem('selectedCurrency', detected.code);
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

  // New function to format currency with only the symbol (prepended)
  const formatCurrencySymbolOnly = useCallback((valueInUSD: number, options?: Intl.NumberFormatOptions): string => {
    const valueInSelectedCurrency = valueInUSD / selectedCurrency.conversionRateToUSD;

    // Format the number without any currency symbol/code
    const numberFormatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2, // Ensure consistent decimal places
      ...options,
      style: 'decimal', // Force decimal style to avoid currency symbols
    });

    const formattedNumber = numberFormatter.format(valueInSelectedCurrency);

    // Prepend the actual symbol
    return `${selectedCurrency.symbol} ${formattedNumber}`;
  }, [selectedCurrency]);

  // New function to format currency as 'Value Symbol' (e.g., '1237.00 ден.')
  const formatCurrencyValueSymbol = useCallback((valueInUSD: number, options?: Intl.NumberFormatOptions): string => {
    const valueInSelectedCurrency = valueInUSD / selectedCurrency.conversionRateToUSD;

    // Format the number as a decimal with 2 decimal places
    const numberFormatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
      style: 'decimal', // Ensure no currency symbols are added by Intl.NumberFormat
    });

    const formattedNumber = numberFormatter.format(valueInSelectedCurrency);

    // Concatenate in the desired format: "1237.00 ден."
    return `${formattedNumber} ${selectedCurrency.symbol}`;
  }, [selectedCurrency]);

  // New: Converts a value (assumed to be in selectedCurrency) to USD
  const convertInputToUSD = useCallback((value: number): number => {
    return value * selectedCurrency.conversionRateToUSD;
  }, [selectedCurrency]);

  // New: Converts a USD value to the selected currency's value (number)
  const convertUSDToSelected = useCallback((valueInUSD: number): number => {
    return valueInUSD / selectedCurrency.conversionRateToUSD;
  }, [selectedCurrency]);

  // New: Function to format currency into parts for flexible rendering
  const formatCurrencyToParts = useCallback((valueInUSD: number, options?: Intl.NumberFormatOptions) => {
    const valueInSelectedCurrency = valueInUSD / selectedCurrency.conversionRateToUSD;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: 2,
      ...options,
    });
    const parts = formatter.formatToParts(valueInSelectedCurrency);
    let symbol = '';
    let value = '';
    for (const part of parts) {
      if (part.type === 'currency') {
        symbol = part.value;
      } else if (part.type === 'integer' || part.type === 'group' || part.type === 'decimal' || part.type === 'fraction') {
        value += part.value;
      }
    }
    return { symbol, value };
  }, [selectedCurrency]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setCurrency, formatCurrency, formatUSD, convertInputToUSD, convertUSDToSelected, formatCurrencySymbolOnly, formatCurrencyValueSymbol, formatCurrencyToParts }}>
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