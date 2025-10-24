import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        emerald: "hsl(var(--emerald))", // Green for up arrow
        blue: "hsl(var(--blue))",       // Electric cyan for accent
        lilac: "hsl(var(--lilac))",     // Keeping for existing usage
        arrowUp: "hsl(var(--arrow-up-color))",
        arrowDown: "hsl(var(--arrow-down-color))",
      },
      borderRadius: {
        lg: "var(--radius)", // Now 12px
        md: "calc(var(--radius) - 4px)", // 8px
        sm: "calc(var(--radius) - 8px)", // 4px
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-green": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "hsl(var(--emerald) / 0.2)" }, // green-500 with opacity
        },
        "pulse-red": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "hsl(var(--destructive) / 0.2)" }, // red-500 with opacity
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "float-up-down": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-green": "pulse-green 1s ease-in-out",
        "pulse-red": "pulse-red 1s ease-in-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-in-from-bottom": "slide-in-from-bottom 0.5s ease-out forwards",
        "float-up-down": "float-up-down 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;