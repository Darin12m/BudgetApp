"use client";

import React, { useState, useCallback } from 'react';
import { useErrorLog } from '@/context/ErrorLogContext';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Info, TriangleAlert, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const GlobalErrorLogger: React.FC = () => {
  const { errors, clearErrors } = useErrorLog();
  const [isOpen, setIsOpen] = useState(true); // State to toggle panel visibility

  // Only render in development mode
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const getIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <TriangleAlert className="w-4 h-4 text-amber-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-primary" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getBorderColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'border-destructive';
      case 'warning':
        return 'border-amber-500';
      case 'info':
        return 'border-primary';
      default:
        return 'border-muted-foreground';
    }
  };

  const latestErrors = errors.slice(0, 5); // Get the last 5 errors

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 bg-card border border-border/50 rounded-lg shadow-xl backdrop-blur-lg text-foreground text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <h3 className="font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span>Error Log ({errors.length})</span>
        </h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(prev => !prev)}
            className="h-7 w-7 text-muted-foreground hover:bg-muted/50"
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearErrors}
            className="h-7 w-7 text-muted-foreground hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
          {latestErrors.length === 0 ? (
            <p className="text-muted-foreground text-center py-2">No errors logged.</p>
          ) : (
            latestErrors.map((err) => (
              <div key={err.id} className={cn("p-2 rounded-md border", getBorderColor(err.type))}>
                <div className="flex items-center space-x-2 mb-1">
                  {getIcon(err.type)}
                  <span className="font-medium truncate">{err.message}</span>
                </div>
                <p className="text-xs text-muted-foreground">{err.timestamp}</p>
                {/* Full stack trace is available on the /console-log page */}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalErrorLogger;