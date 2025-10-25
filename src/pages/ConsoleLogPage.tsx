"use client";

import React, { useCallback } from 'react';
import { useErrorLog } from '@/context/ErrorLogContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, AlertCircle, Info, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ConsoleLogPage: React.FC = () => {
  const { errors, clearErrors } = useErrorLog();

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy.'));
  }, []);

  const getIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <TriangleAlert className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getBorderColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'border-destructive/50';
      case 'warning':
        return 'border-amber-500/50';
      case 'info':
        return 'border-primary/50';
      default:
        return 'border-border/50';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 sm:p-6">
      <Card className="flex-1 card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">Console Log</CardTitle>
          <Button onClick={clearErrors} variant="outline" className="bg-muted/50 border-none hover:bg-muted">
            Clear Logs
          </Button>
        </CardHeader>
        <CardContent className="h-[calc(100vh-150px)]"> {/* Adjust height dynamically */}
          <ScrollArea className="h-full w-full rounded-md border border-border/50 p-2">
            {errors.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No errors logged yet.
              </div>
            ) : (
              <div className="space-y-4">
                {errors.map((err) => (
                  <div key={err.id} className={cn("bg-muted/20 p-4 rounded-lg border", getBorderColor(err.type))}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getIcon(err.type)}
                        <span className="text-sm text-muted-foreground">{err.timestamp}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(JSON.stringify(err, null, 2))}
                        className="h-8 w-8 text-muted-foreground hover:bg-muted/50"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-semibold text-foreground mb-1">{err.message}</p>
                    {err.stack && (
                      <pre className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md overflow-auto max-h-24 mt-2">
                        <code>{err.stack}</code>
                      </pre>
                    )}
                    {err.componentStack && (
                      <pre className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md overflow-auto max-h-24 mt-2">
                        <code>{err.componentStack}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsoleLogPage;