"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SortAsc, TrendingUp, TrendingDown, Wallet, DollarSign, Bitcoin } from 'lucide-react';
import InvestmentListItem from '@/components/InvestmentListItem';
import { Investment } from '@/hooks/use-investment-data';

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
}) => {
  return (
    <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-[150px] h-9 text-xs bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0">
              <SortAsc className="h-3 w-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="gainLossPercentage">Gain/Loss %</SelectItem>
              <SelectItem value="totalValue">Total Value</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={onToggleSortOrder} className="h-9 w-9 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
            {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {investments.length > 0 ? (
            investments.map(inv => (
              <InvestmentListItem key={inv.id} investment={inv} onEdit={onEditInvestment} priceChangeStatus={priceChange.get(inv.id) || 'none'} />
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <EmptyIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">{emptyMessage}</p>
              <p className="text-sm mt-2">Add your first holding to track its live performance.</p>
              <Button onClick={onAddInvestment} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
                {emptyButtonText}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentHoldingsList;