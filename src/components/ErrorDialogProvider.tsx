"use client";

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ErrorDialogContextType {
  showDetailedError: (title: string, message: string, code?: string, stack?: string) => void;
}

const ErrorDialogContext = createContext<ErrorDialogContextType | undefined>(undefined);

export const ErrorDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState<string | undefined>(undefined);
  const [stack, setStack] = useState<string | undefined>(undefined);

  const showDetailedError = useCallback((
    newTitle: string,
    newMessage: string,
    newCode?: string,
    newStack?: string
  ) => {
    setTitle(newTitle);
    setMessage(newMessage);
    setCode(newCode);
    setStack(newStack);
    setIsOpen(true);
  }, []);

  const contextValue = React.useMemo(() => ({ showDetailedError }), [showDetailedError]);

  return (
    <ErrorDialogContext.Provider value={contextValue}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-md md:max-w-lg lg:max-w-xl bg-card text-foreground card-shadow border border-border/50 backdrop-blur-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-destructive">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(code || stack) && (
            <ScrollArea className="max-h-[200px] w-full rounded-md border p-4 text-sm bg-muted/50 text-muted-foreground">
              {code && <p className="font-semibold mb-2">Error Code: <span className="font-normal text-foreground">{code}</span></p>}
              {stack && (
                <>
                  <p className="font-semibold mb-1">Details:</p>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">{stack}</pre>
                </>
              )}
            </ScrollArea>
          )}
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button onClick={() => setIsOpen(false)} className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground">
                Close
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorDialogContext.Provider>
  );
};

export const useErrorDialog = () => {
  const context = useContext(ErrorDialogContext);
  if (context === undefined) {
    throw new Error('useErrorDialog must be used within an ErrorDialogProvider');
  }
  return context;
};