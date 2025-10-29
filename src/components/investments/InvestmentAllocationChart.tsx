"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import SmartDonutChart from '@/components/SmartDonutChart'; // Import SmartDonutChart
import { motion } from 'framer-motion';

interface AllocationData {
  name: string;
  value: number;
  color: string;
}

interface InvestmentAllocationChartProps {
  title: string;
  data: AllocationData[];
  emptyMessage: string;
}

const InvestmentAllocationChart: React.FC<InvestmentAllocationChartProps> = ({ title, data, emptyMessage }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { formatCurrency } = useCurrency();

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      className="glassmorphic-card"
      whileHover={{ scale: 1.01, boxShadow: "var(--tw-shadow-glass-md)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] flex items-center justify-center">
        {data.length > 0 ? (
          <SmartDonutChart
            chartId={`investment-allocation-${title.replace(/\s/g, '-')}`}
            mainValue={totalValue}
            mainLabel={t("dashboard.totalAllocated")}
            data={data}
            innerRadius={60}
            outerRadius={90}
            formatValue={formatCurrency}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            strokeWidth={1}
            strokeColor="transparent"
            backgroundFill="hsl(var(--muted)/50%)"
            mainTextColorClass="text-foreground"
            mainFontWeightClass="font-bold"
            tooltipFormatter={(value, name) => [formatCurrency(value), name]}
            gradientColors={['hsl(var(--blue))', 'hsl(var(--emerald))', 'hsl(var(--lilac))']}
            animateGradientBorder={true}
            showLegend={true}
          />
        ) : (
          <p className="text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </motion.div>
  );
};

export default InvestmentAllocationChart;