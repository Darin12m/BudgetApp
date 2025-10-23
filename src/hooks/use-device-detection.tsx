"use client";

import { useState, useEffect } from 'react';

interface DeviceDetection {
  isMobile: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

const MOBILE_BREAKPOINT = 768; // Define your mobile breakpoint

export function useDeviceDetection(): DeviceDetection {
  const [device, setDevice] = useState<DeviceDetection>({
    isMobile: false,
    isDesktop: true, // Assume desktop initially for SSR or until JS runs
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent); // Removed !window.MSStream
    const isAndroid = /Android/.test(userAgent);

    const handleResize = () => {
      const currentIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setDevice({
        isMobile: currentIsMobile,
        isDesktop: !currentIsMobile,
        isIOS: isIOS,
        isAndroid: isAndroid,
      });
    };

    // Set initial state
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array means this runs once on mount

  return device;
}