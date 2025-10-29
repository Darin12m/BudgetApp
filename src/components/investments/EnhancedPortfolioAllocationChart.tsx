"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import DonutWithCenterText from '@/components/DonutWithCenterText'; // Import the new DonutWithCenterText component

interface AllocationData {
  name: string;
  value: number;
  color?: string; // Color will be assigned internally
}

interface EnhancedPortfolioAllocationChartProps {
  title: string;
  data: AllocationData[];
  emptyMessage: string;
  totalPortfolioValue: number;
}

// Define a new, high-contrast color palette for the chart
const CHART_PALETTE = [
  'hsl(var(--primary))',     // Electric Cyan
  'hsl(var(--emerald))',     // Green
  'hsl(var(--lilac))',       // Lilac
  'hsl(25 95% 53%)',         // A vibrant orange
  'hsl(220 70% 50%)',        // A distinct blue
  'hsl(340 80% 60%)',        // A strong pink/magenta
  'hsl(175 70% 40%)',        // A deep teal
  'hsl(60 90% 50%)',         // A bright yellow
  'hsl(280 50% 70%)',        // A softer purple
  'hsl(10 80% 60%)',         // A warm red-orange
];

interface AllocationLegendListProps {
  chartData: (AllocationData & { percentage: number; color: string })[];
  formatCurrency: (value: number) => string;
}

const AllocationLegendList: React.FC<AllocationLegendListProps> = ({
  chartData,
  formatCurrency,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full sm:w-1/2 max-h-[200px] overflow-y-auto pr-2">
      {chartData.map((entry, index) => (
        <div
          key={`legend-item-${index}`}
          className={cn(
            "flex items-center justify-between p-2 rounded-md transition-colors"
          )}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-foreground truncate">{entry.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{entry.percentage.toFixed(0)}%</span>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(entry.value)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};


const EnhancedPortfolioAllocationChart: React.FC<EnhancedPortfolioAllocationChartProps> = ({ title, data, emptyMessage, totalPortfolioValue }) => {
  const { formatCurrency } = useCurrency(); // Only need formatCurrency for tooltips/legend

  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      color: CHART_PALETTE[index % CHART_PALETTE.length], // Assign color from new palette
    }));
  }, [data]);

  return (
    <Card className="card-shadow border-none bg-card border border-border/50 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] flex flex-col sm:flex-row items-center justify-center p-4 sm:p-6">
        {chartData.length > 0 ? (
          <div className="relative w-full sm:w-1/2 h-full flex items-center justify-center mb-4 sm:mb-0">
            <DonutWithCenterText
              chartId="portfolio-allocation"
              mainValue={totalPortfolioValue.toFixed(2)} // Display only the number, formatted to 2 decimal places
              mainLabel="Total Allocated"
              data={chartData.map(item => ({ ...item, color: item.color || 'hsl(var(--primary))' }))} // Ensure color is always set
              innerRadius={60}
              outerRadius={90}
              formatValue={formatCurrency} // Keep currency formatting for tooltips
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              strokeWidth={1}
              strokeColor="transparent" // No stroke for individual slices
              backgroundFill="hsl(var(--muted)/50%)" // Background for the full circle
            />
          </div>
        ) : (
          <p className="text-muted-foreground w-full text-center">{emptyMessage}</p>
        )}
        {chartData.length > 0 && (
          <AllocationLegendList
            chartData={chartData}
            formatCurrency={formatCurrency}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedPortfolioAllocationChart;