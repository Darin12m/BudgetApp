"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 m-4">
    <div className="flex items-center">
      <AlertCircle className="w-5 h-5 text-destructive mr-2" />
      <div>
        <h3 className="text-sm font-medium text-destructive">Error</h3>
        <p className="text-sm text-destructive mt-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );

export default ErrorMessage;