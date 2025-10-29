"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';
import ProDonut from '@/components/ProDonut'; // Import new ProDonut chart

interface AllocationData {
  name: string;
  value: number;
  color?: string;
}

interface EnhancedPortfolioAllocationChartProps {
  title: string;
  data: AllocationData[];
  emptyMessage: string;
  totalPortfolioValue: number;
}

const CHART_PALETTE = [
  'hsl(var(--blue))',
  'hsl(var(--emerald))',
  'hsl(var(--lilac))',
  'hsl(25 95% 53%)',
  'hsl(220 70% 50%)',
  'hsl(340 80% 60%)',
  'hsl(175 70% 40%)',
  'hsl(60 90% 50%)',
  'hsl(280 50% 70%)',
  'hsl(10 80% 60%)',
];

interface AllocationLegendListProps {
  chartData: (AllocationData & { percentage: number; color: string })[];
  formatCurrency: (value: number) => string;
}

const AllocationLegendList: React.FC<AllocationLegendListProps> = ({
  chartData,
  formatCurrency,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  return (
    <div className="flex flex-col gap-2 w-full sm:w-1/2 max-h-[200px] overflow-y-auto pr-2">
      {chartData.map((entry, index) => (
        <motion.div
          key={`legend-item-${index}`}
          className={cn(
            "flex items-center justify-between p-2 rounded-md transition-colors"
          )}
          whileHover={{ scale: 1.02, backgroundColor: "hsl(var(--muted)/20%)" }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-foreground truncate">{entry.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground font-mono">{entry.percentage.toFixed(0)}%</span>
            <span className="text-sm font-semibold text-foreground font-mono">{formatCurrency(entry.value)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};


const EnhancedPortfolioAllocationChart: React.FC<EnhancedPortfolioAllocationChartProps> = ({ title, data, emptyMessage, totalPortfolioValue }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency, formatCurrencyValueSymbol } = useCurrency();

  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));
  }, [data, CHART_PALETTE]); // Corrected: changed 'palette' to 'CHART_PALETTE'

  return (
    <motion.div
      className="glassmorphic-card"
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] flex flex-col sm:flex-row items-center justify-center p-4 sm:p-6">
        {chartData.length > 0 ? (
          <>
            <div className="relative w-full sm:w-1/2 h-full flex items-center justify-center mb-4 sm:mb-0">
              <ProDonut
                chartId="portfolio-allocation"
                data={chartData.map(item => ({ name: item.name, value: item.value, color: item.color }))}
                totalValue={totalPortfolioValue}
                totalLabel={t("dashboard.totalAllocated")}
                innerRadius={60}
                outerRadius={90}
              />
            </div>
            <AllocationLegendList
              chartData={chartData}
              formatCurrency={formatCurrency}
            />
          </>
        ) : (
          <p className="text-muted-foreground w-full text-center">{emptyMessage}</p>
        )}
      </CardContent>
    </motion.div>
  );
};

export default EnhancedPortfolioAllocationChart;