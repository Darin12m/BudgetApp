"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SortAsc, TrendingUp, TrendingDown, Wallet, DollarSign, Bitcoin } from 'lucide-react';
import InvestmentListItem from '@/components/InvestmentListItem';
import { Investment } from '@/hooks/use-investment-data';
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface InvestmentHoldingsListProps {
  title: string;
  investments: Investment[];
  sortBy: 'name' | 'gainLossPercentage' | 'totalValue';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: 'name' | 'gainLossPercentage' | 'totalValue') => void;
  onToggleSortOrder: () => void;
  onEditInvestment: (investment: Investment) => void;
  priceChange: Map<string, 'up' | 'down' | 'none'>;
  onAddInvestment: () => void;
  emptyMessage: string;
  emptyIcon: React.ElementType;
  emptyButtonText: string;
  alertedInvestments: Map<string, boolean>; // New prop for alert status
}

const InvestmentHoldingsList: React.FC<InvestmentHoldingsListProps> = ({
  title,
  investments,
  sortBy,
  sortOrder,
  onSortByChange,
  onToggleSortOrder,
  onEditInvestment,
  priceChange,
  onAddInvestment,
  emptyMessage,
  emptyIcon: EmptyIcon,
  emptyButtonText,
  alertedInvestments,
}) => {
  const { t } = useTranslation();
  return (
    <Card className="glassmorphic-card"> {/* Applied consistent card style */}
      <motion.div
        whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
          <CardTitle className="text-base sm:text-lg font-semibold tracking-tight truncate">{title}</CardTitle> {/* Applied consistent typography and truncate */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-[150px] h-9 text-xs bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
                <SortAsc className="h-3 w-3 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t("investments.assetName")}</SelectItem>
                <SelectItem value="gainLossPercentage">{t("investments.gainLossPercentage")}</SelectItem>
                <SelectItem value="totalValue">{t("investments.totalValue")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={onToggleSortOrder} className="h-9 w-9 bg-muted/50 border-none">
              {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 lg:p-6 pt-0"> {/* Applied consistent padding */}
          <div className="space-y-3 divide-y divide-border/10"> {/* Applied consistent divider */}
            {investments.length > 0 ? (
              investments.map(inv => (
                <InvestmentListItem
                  key={inv.id}
                  investment={inv}
                  onEdit={onEditInvestment}
                  priceChangeStatus={priceChange.get(inv.id) || 'none'}
                  isAlerted={alertedInvestments.get(inv.id) || false} // Pass alert status
                />
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <EmptyIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-base sm:text-lg font-semibold text-foreground break-words text-balance">{emptyMessage}</p> {/* Applied consistent typography and text wrapping */}
                <p className="text-xs sm:text-sm mt-2 break-words text-balance">Add your first holding to track its live performance.</p> {/* Applied consistent typography and text wrapping */}
                <Button onClick={onAddInvestment} className="mt-4">
                  {emptyButtonText}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </motion.div>
    </Card>
  );
};

export default InvestmentHoldingsList;