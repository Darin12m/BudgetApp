"use client";

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SvgDonutChartProps {
  mainText: string;
  subText?: string;
  percentage: number; // 0-100 for the progress circle
  innerRadius: number;
  outerRadius: number;
  chartId: string; // Unique ID for gradients
  formatValue: (value: number, options?: Intl.NumberFormatOptions) => string;
  mainTextColorClass?: string; // No longer used for color, but kept for other potential text styles
  subTextColorClass?: string; // No longer used for color, but kept for other potential text styles
  mainFontWeightClass?: string;
  subFontWeightClass?: string;
  progressColor?: string; // For solid color progress
  backgroundColor?: string;
  gradientColors?: { from: string; to: string }; // For gradient progress
  className?: string; // Additional classes for the outer div
  isOverBudget?: boolean; // For conditional styling/animation
}

const SvgDonutChart: React.FC<SvgDonutChartProps> = ({
  mainText,
  subText,
  percentage,
  innerRadius,
  outerRadius,
  chartId,
  formatValue,
  mainTextColorClass, // Removed default 'text-white' as fill will be explicit
  subTextColorClass, // Removed default 'text-white' as fill will be explicit
  mainFontWeightClass = 'font-bold',
  subFontWeightClass = 'font-normal',
  progressColor,
  backgroundColor = 'hsl(var(--muted)/50%)',
  gradientColors,
  className,
  isOverBudget = false,
}) => {
  const viewBoxSize = 200; // Standard viewBox size for consistent scaling
  const centerX = viewBoxSize / 2;
  const centerY = viewBoxSize / 2;

  const radius = (innerRadius + outerRadius) / 2;
  const strokeWidth = outerRadius - innerRadius;
  const circumference = 2 * Math.PI * radius;

  // Ensure percentage is within 0-100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  // Determine the fill for the progress circle
  const progressFill = useMemo(() => {
    if (gradientColors) {
      return `url(#${chartId}-gradient-progress)`;
    }
    return progressColor || 'hsl(var(--primary))'; // Default to primary if no gradient or solid color
  }, [gradientColors, progressColor, chartId]);

  // Dynamic font sizing for SVG text
  const calculateFontSize = useCallback((text: string, maxDiameter: number, baseSize: number, charFactor: number) => {
    if (!text) return 0;
    // A heuristic: scale font size based on text length relative to available diameter
    // Adjust charFactor and baseSize for desired visual density
    const estimatedLengthFactor = text.length > 0 ? Math.sqrt(text.length) : 1; // Use sqrt for less aggressive scaling
    const calculatedSize = (maxDiameter / estimatedLengthFactor) * charFactor;
    return Math.max(10, Math.min(baseSize, calculatedSize)); // Clamp between min and baseSize
  }, []);

  const textDiameter = innerRadius * 1.8; // Text should fit within 90% of inner diameter

  const mainTextFontSize = calculateFontSize(mainText, textDiameter, 28, 0.3);
  const subTextFontSize = calculateFontSize(subText || '', textDiameter, 16, 0.2);

  // State for animation
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const duration = 1000; // 1 second animation

    const animate = (currentTime: number) => {
      if (!start) start = currentTime;
      const progress = Math.min((currentTime - start) / duration, 1);
      setAnimatedPercentage(percentage * progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [percentage]);

  const animatedStrokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className={cn("w-full h-full", isOverBudget && 'animate-pulse-red-glow')}
      >
        <defs>
          {gradientColors && (
            <linearGradient id={`${chartId}-gradient-progress`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.from} />
              <stop offset="100%" stopColor={gradientColors.to} />
            </linearGradient>
          )}
        </defs>

        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="transparent"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="transparent"
          stroke={progressFill}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${centerX} ${centerY})`} // Start from top
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} // Animate stroke-dashoffset
        />

        {/* Central Text */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="pointer-events-none"
        >
          <tspan
            x={centerX}
            dy="-0.3em" // Adjust vertical position for main text
            className={cn(mainFontWeightClass)} // Removed mainTextColorClass
            style={{ fontSize: `${mainTextFontSize}px` }}
            fill="white" // Explicitly set fill to white
          >
            {mainText}
          </tspan>
          {subText && (
            <tspan
              x={centerX}
              dy="1.2em" // Adjust vertical position for sub text relative to main text
              className={cn("text-xs", subFontWeightClass)} // Removed subTextColorClass
              style={{ fontSize: `${subTextFontSize}px` }}
              fill="white" // Explicitly set fill to white
            >
              {subText}
            </tspan>
          )}
        </text>
      </svg>
    </div>
  );
};

export default SvgDonutChart;