"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button for onRetry

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 m-4">
    <div className="flex items-center">
      <AlertCircle className="w-5 h-5 text-destructive mr-2" />
      <div>
        <h3 className="p font-medium text-destructive">Error</h3>
        <p className="p text-destructive mt-1">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="link"
            className="mt-2 p text-destructive hover:text-destructive/80 underline h-auto px-0"
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  </div>
);

export default ErrorMessage;