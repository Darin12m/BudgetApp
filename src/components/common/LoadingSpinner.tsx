"use client";

import React from 'react';
import { Card } from '@/components/ui/card'; // Import Card

const LoadingSpinner: React.FC = () => (
  <Card className="glassmorphic-card flex items-center justify-center p-4 sm:p-5 lg:p-6"> {/* Applied consistent card style and padding */}
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2 text-sm text-muted-foreground">Loading data...</span> {/* Applied consistent typography */}
  </Card>
);

export default LoadingSpinner;