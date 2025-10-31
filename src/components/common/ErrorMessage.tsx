"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button for onRetry
import { Card } from '@/components/ui/card'; // Import Card

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <Card className="glassmorphic-card bg-destructive/10 border-destructive/20 p-4 sm:p-5 lg:p-6"> {/* Applied consistent card style and padding */}
    <div className="flex items-center">
      <AlertCircle className="w-5 h-5 text-destructive mr-2 flex-shrink-0" />
      <div className="min-w-0"> {/* Added min-w-0 */}
        <h3 className="text-sm sm:text-base font-medium text-destructive truncate">Error</h3> {/* Applied consistent typography and truncate */}
        <p className="text-sm text-destructive mt-1 break-words text-balance">{message}</p> {/* Applied consistent typography and text wrapping */}
        {onRetry && (
          <Button
            variant="link"
            className="mt-2 text-sm text-destructive hover:text-destructive/80 underline h-auto px-0" /* Applied consistent typography */
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  </Card>
);

export default ErrorMessage;