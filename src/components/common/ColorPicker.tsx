"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ colors, selectedColor, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(color)}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            selectedColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        >
          {selectedColor === color && <Check className="h-4 w-4 text-white" />}
        </button>
      ))}
    </div>
  );
};

export default ColorPicker;