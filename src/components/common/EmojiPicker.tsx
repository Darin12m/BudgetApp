"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  emojis: string[];
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ emojis, selectedEmoji, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {emojis.map((emoji, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(emoji)}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xl transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            selectedEmoji === emoji ? "ring-2 ring-offset-2 ring-primary bg-muted/50" : "hover:bg-muted/50"
          )}
          aria-label={`Select emoji ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;