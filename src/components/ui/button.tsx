"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion"; // Import motion

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] rounded-xl", // Added rounded-xl and min-h-[44px]
  {
    variants: {
      variant: {
        default: "glassmorphic-card text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/20", // Matches Add Transaction button
        destructive:
          "glassmorphic-card bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "glassmorphic-card border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "glassmorphic-card bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "glassmorphic-card hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3", // Adjusted rounded
        lg: "h-11 rounded-xl px-8", // Adjusted rounded
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button; // Use motion.button
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 1.02, boxShadow: "var(--tw-shadow-glass-sm)" }} // Add Framer Motion hover effects
        whileTap={{ scale: 0.98 }} // Add Framer Motion tap effects
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };