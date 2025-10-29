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
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Set Poppins as the default sans-serif font
      },
      colors: {
        // Light Theme (default)
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
        amber: { // Adding amber for warning state
          "500": "hsl(var(--amber-500))",
        },
        // New gradient colors for SmartDonut
        'gradient-start': 'var(--gradient-start)',
        'gradient-middle': 'var(--gradient-middle)',
        'gradient-end': 'var(--gradient-end)',
      },
      borderRadius: {
        lg: "1.5rem", // Increased from 1rem (16px) to 24px
        md: "1rem",   // Adjusted from calc(var(--radius) - 4px) to 16px
        sm: "0.75rem", // Adjusted from calc(var(--radius) - 8px) to 12px
        xl: "2rem",   // Explicitly define xl for 32px
        "2xl": "2.5rem", // Even larger for hero cards
        "3xl": "3rem", // Max for very rounded elements
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
        "pulse-red-glow": { // New keyframe for pulsing red glow
          "0%, 100%": {
            "box-shadow": "0 0 0px rgba(229, 57, 53, 0.4)", /* Destructive color with opacity */
            "border-color": "hsl(var(--destructive))"
          },
          "50%": {
            "box-shadow": "0 0 15px rgba(229, 57, 53, 0.8)", /* More intense glow */
            "border-color": "hsl(var(--destructive))"
          },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translate(-50%, -45%) scale(0.98)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "scale-in": { // New animation for scaling in
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "rotate-gradient": { // Keyframe for rotating gradient border
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        "shimmer": { // Skeleton loader shimmer
          "100%": {
            transform: "translateX(100%)",
          },
        },
        "pulse-glow": { // New keyframe for pulsing halo glow
          "0%, 100%": { opacity: "0.5", transform: "scale(0.9)" },
          "50%": { opacity: "0.8", transform: "scale(1.0)" },
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
        "pulse-red-glow": "pulse-red-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", // New animation
        "modal-in": "modal-in 0.18s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards", // New animation
        "rotate-gradient": "rotate-gradient 3s ease-in-out infinite alternate", // Apply to gradient border
        "shimmer": "shimmer 1.5s infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite alternate", // Apply new animation
      },
      boxShadow: {
        glass: '0 10px 30px rgba(0,0,0,0.35)', // Soft, diffused shadow for glassmorphism
        'glass-sm': '0 5px 15px rgba(0,0,0,0.2)',
        'glass-md': '0 15px 40px rgba(0,0,0,0.4)',
        'glass-lg': '0 20px 50px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;