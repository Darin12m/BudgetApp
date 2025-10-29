"use client";

import React from 'react';
import { useFirestoreStatus } from '@/hooks/use-firestore-status';
import { useAuth } from '@/hooks/use-auth'; // Assuming you have a useAuth hook
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const SyncStatusIndicator: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { user } = useAuth(); // Get user from auth context
  const { status, lastSyncTime, error } = useFirestoreStatus(user?.uid || null);

  if (!user) {
    return null; // Don't show indicator if not logged in
  }

  let icon;
  let colorClass;
  let tooltipText;

  switch (status) {
    case 'synced':
      icon = <Wifi className="h-4 w-4" />;
      colorClass = 'text-emerald';
      tooltipText = lastSyncTime ? t("syncStatus.syncedLast", { time: formatDistanceToNowStrict(lastSyncTime, { addSuffix: true }) }) : t("syncStatus.synced");
      break;
    case 'offline':
      icon = <WifiOff className="h-4 w-4" />;
      colorClass = 'text-muted-foreground';
      tooltipText = t("syncStatus.offline");
      break;
    case 'syncing':
      icon = <Loader2 className="h-4 w-4 animate-spin" />;
      colorClass = 'text-primary';
      tooltipText = t("syncStatus.syncing");
      break;
    case 'error':
      icon = <AlertCircle className="h-4 w-4" />;
      colorClass = 'text-destructive';
      tooltipText = t("syncStatus.error", { message: error || t("syncStatus.unknownError") });
      break;
    default:
      return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "fixed bottom-4 left-4 p-2 rounded-full bg-card shadow-lg border border-border/50 z-50 flex items-center justify-center transition-colors duration-300",
          colorClass
        )}>
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-tooltip-bg border-tooltip-border-color text-tooltip-text-color">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SyncStatusIndicator;