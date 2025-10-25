"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DynamicTextInCircleProps {
  mainText: string;
  subText?: string;
  containerSize: number; // Diameter of the circular area where text should fit
  maxFontSizePx?: number; // Maximum font size in pixels
  minFontSizePx?: number; // Minimum font size in pixels
  mainTextColorClass?: string;
  subTextColorClass?: string;
  mainFontWeightClass?: string;
  subFontWeightClass?: string;
  className?: string; // Additional classes for the outer div
}

const DynamicTextInCircle: React.FC<DynamicTextInCircleProps> = ({
  mainText,
  subText,
  containerSize, // e.g., 180 for a 180px diameter circle
  maxFontSizePx = 40,
  minFontSizePx = 12,
  mainTextColorClass = 'text-foreground',
  subTextColorClass = 'text-muted-foreground',
  mainFontWeightClass = 'font-bold',
  subFontWeightClass = 'font-normal',
  className,
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [currentFontSize, setCurrentFontSize] = useState(maxFontSizePx);

  const adjustFontSize = useCallback(() => {
    if (!textRef.current) return;

    const textElement = textRef.current;
    const parentWidth = containerSize; // Use containerSize as the target width/height
    const parentHeight = containerSize;

    // Reset font size to max to measure actual content size
    textElement.style.fontSize = `${maxFontSizePx}px`;

    let currentTextWidth = textElement.scrollWidth;
    let currentTextHeight = textElement.scrollHeight;
    let newFontSize = maxFontSizePx;

    // Shrink font size until it fits within the parent's dimensions
    while (
      (currentTextWidth > parentWidth * 0.9 || currentTextHeight > parentHeight * 0.9) && // 90% to leave some padding
      newFontSize > minFontSizePx
    ) {
      newFontSize -= 1;
      textElement.style.fontSize = `${newFontSize}px`;
      currentTextWidth = textElement.scrollWidth;
      currentTextHeight = textElement.scrollHeight;
    }

    // Ensure it doesn't grow beyond maxFontSizePx if it was already small
    if (newFontSize > maxFontSizePx) {
      newFontSize = maxFontSizePx;
    }

    setCurrentFontSize(newFontSize);
  }, [mainText, subText, containerSize, maxFontSizePx, minFontSizePx]);

  useEffect(() => {
    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [adjustFontSize]);

  return (
    <div
      ref={textRef}
      className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none animate-scale-in",
        className
      )}
      style={{
        // Set initial font size for measurement, will be updated by adjustFontSize
        fontSize: `${currentFontSize}px`,
        lineHeight: '1.2', // Adjust line height for better vertical spacing
        maxWidth: `${containerSize * 0.9}px`, // Constrain max width for initial render
        maxHeight: `${containerSize * 0.9}px`, // Constrain max height for initial render
      }}
    >
      <span className={cn(mainTextColorClass, mainFontWeightClass)} style={{ fontSize: `${currentFontSize}px` }}>
        {mainText}
      </span>
      {subText && (
        <span className={cn("text-xs", subTextColorClass, subFontWeightClass)} style={{ fontSize: `${currentFontSize * 0.4}px` }}> {/* Subtext is smaller */}
          {subText}
        </span>
      )}
    </div>
  );
};

export default DynamicTextInCircle;