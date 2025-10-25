"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { format } from 'date-fns';

interface ErrorLogEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  type: 'error' | 'warning' | 'info';
}

interface ErrorLogContextType {
  errors: ErrorLogEntry[];
  addError: (message: string, type?: 'error' | 'warning' | 'info', stack?: string, componentStack?: string) => void;
  clearErrors: () => void;
}

const ErrorLogContext = createContext<ErrorLogContextType | undefined>(undefined);

export const ErrorLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);

  const addError = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'error', stack?: string, componentStack?: string) => {
    const newEntry: ErrorLogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      message,
      stack,
      componentStack,
      type,
    };
    setErrors((prevErrors) => [newEntry, ...prevErrors].slice(0, 100)); // Keep last 100 errors
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorLogContext.Provider value={{ errors, addError, clearErrors }}>
      {children}
    </ErrorLogContext.Provider>
  );
};

export const useErrorLog = () => {
  const context = useContext(ErrorLogContext);
  if (context === undefined) {
    throw new Error('useErrorLog must be used within an ErrorLogProvider');
  }
  return context;
};