"use client";

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DynamicTextInCircleProps {
  mainText: string;
  subText?: string;
  containerSize: number; // Diameter of the circle containing the text
  maxFontSizePx?: number;
  minFontSizePx?: number;
  mainFontWeightClass?: string;
  subFontWeightClass?: string;
  className?: string; // Additional classes for the outer div
}

const DynamicTextInCircle: React.FC<DynamicTextInCircleProps> = ({
  mainText,
  subText,
  containerSize,
  maxFontSizePx = 24,
  minFontSizePx = 10,
  mainFontWeightClass = 'font-bold',
  subFontWeightClass = 'font-normal',
  className,
}) => {
  const centerX = containerSize / 2;
  const centerY = containerSize / 2;

  // Dynamic font sizing for SVG text
  const calculateFontSize = useCallback((text: string, maxDiameter: number, baseSize: number, charFactor: number) => {
    if (!text) return 0;
    const estimatedLengthFactor = text.length > 0 ? Math.sqrt(text.length) : 1;
    const calculatedSize = (maxDiameter / estimatedLengthFactor) * charFactor;
    return Math.max(minFontSizePx, Math.min(baseSize, calculatedSize));
  }, [minFontSizePx]);

  const textDiameter = containerSize * 0.9; // Text should fit within 90% of container diameter

  const mainTextFontSize = calculateFontSize(mainText, textDiameter, maxFontSizePx, 0.3);
  const subTextFontSize = calculateFontSize(subText || '', textDiameter, maxFontSizePx * 0.6, 0.2);

  return (
    <div
      className={cn("absolute flex items-center justify-center pointer-events-none", className)}
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <svg
        width={containerSize}
        height={containerSize}
        viewBox={`0 0 ${containerSize} ${containerSize}`}
      >
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          <tspan
            x={centerX}
            dy={subText ? "-0.3em" : "0em"} // Adjust vertical position for main text
            className={cn(mainFontWeightClass)}
            style={{ fontSize: `${mainTextFontSize}px` }}
            fill="white" // Explicitly set fill to white
          >
            {mainText}
          </tspan>
          {subText && (
            <tspan
              x={centerX}
              dy="1.2em" // Adjust vertical position for sub text relative to main text
              className={cn("text-xs", subFontWeightClass)}
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

export default DynamicTextInCircle;