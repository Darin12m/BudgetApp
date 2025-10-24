"use client";

import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, format, duration = 500 }) => {
  const [currentValue, setCurrentValue] = useState(value);

  // Update currentValue when the prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const { number } = useSpring({
    from: { number: 0 }, // Start from 0 for initial load
    to: { number: currentValue },
    delay: 200, // Small delay to allow other animations to start
    config: { duration: duration },
  });

  return <animated.span>{number.to(n => format(n))}</animated.span>;
};

export default AnimatedNumber;