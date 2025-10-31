"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ProDonut from '@/components/ProDonut';
import { TrendingUp, TrendingDown, Wallet, LayoutDashboard, DollarSign, Bitcoin } from 'lucide-react';

interface AllocationData {
  name: string;
  value: number;
  color?: string;
}

interface AllocationCardProps {
  title: string;
  data: AllocationData[];
  emptyMessage: string;
  totalPortfolioValue: number;
  icon: React.ElementType; // Icon for the card header
  sevenDayChange?: { value: number; isPositive: boolean }; // Optional 7-day change data
}

const CHART_PALETTE = [
  'hsl(var(--blue))',
  'hsl(var(--emerald))',
  'hsl(var(--lilac))',
  'hsl(25 95% 53%)', // Amber
  'hsl(220 70% 50%)', // Indigo
  'hsl(340 80% 60%)', // Pink
  'hsl(175 70% 40%)', // Cyan
  'hsl(60 90% 50%)',  // Yellow
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
  const { t } = useTranslation();
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
          <div className="flex items-center space-x-2 min-w-0"> {/* Added min-w-0 */}
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-foreground truncate">{entry.name}</span> {/* Added truncate */}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground font-mono">{entry.percentage.toFixed(0)}%</span>
            <span className="text-sm font-semibold text-foreground font-mono">{formatCurrency(entry.value)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const AllocationCard: React.FC<AllocationCardProps> = ({ title, data, emptyMessage, totalPortfolioValue, icon: Icon, sevenDayChange }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));
  }, [data]);

  const ChangeIcon = sevenDayChange?.isPositive ? TrendingUp : TrendingDown;
  const changeColor = sevenDayChange?.isPositive ? 'text-emerald' : 'text-destructive';

  return (
    <motion.div
      className="gradient-border rounded-2xl p-px animate-in fade-in slide-in-from-bottom-2 duration-300"
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card className="glassmorphic-card rounded-[calc(2rem-1px)] h-full"> {/* Adjusted rounded to match parent border */}
        <CardHeader className="flex flex-col space-y-2 p-4 sm:p-5 lg:p-6 pb-2"> {/* Applied consistent padding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0"> {/* Added min-w-0 */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="p-2 bg-primary/10 rounded-full text-primary flex-shrink-0"
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <CardTitle className="text-base sm:text-lg font-semibold tracking-tight truncate">{title}</CardTitle> {/* Applied consistent typography and truncate */}
            </div>
            {sevenDayChange && (
              <motion.div
                className={cn("flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0", sevenDayChange.isPositive ? 'bg-emerald/10' : 'bg-destructive/10')}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <ChangeIcon className={cn("w-3 h-3", changeColor)} />
                <span className={changeColor}>{sevenDayChange.value.toFixed(2)}%</span>
                <span className="text-muted-foreground">{t("common.7day")}</span>
              </motion.div>
            )}
          </div>
          <motion.div
            className="w-full h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 mt-2"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </CardHeader>
        <CardContent className="h-[280px] flex flex-col sm:flex-row items-center justify-center p-4 sm:p-5 lg:p-6 pt-0"> {/* Applied consistent padding */}
          {chartData.length > 0 ? (
            <>
              <div className="relative w-full sm:w-1/2 h-full flex items-center justify-center mb-4 sm:mb-0">
                <ProDonut
                  chartId={`allocation-${title.replace(/\s/g, '-')}`}
                  data={chartData.map(item => ({ name: item.name, value: item.value, color: item.color }))}
                  totalValue={totalPortfolioValue}
                  totalLabel={t("dashboard.totalAllocated")}
                  innerRadius={60}
                  outerRadius={90}
                  palette={CHART_PALETTE}
                />
              </div>
              <AllocationLegendList
                chartData={chartData}
                formatCurrency={formatCurrency}
              />
            </>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground w-full text-center break-words text-balance">{emptyMessage}</p> // Applied consistent typography and text wrapping
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AllocationCard;