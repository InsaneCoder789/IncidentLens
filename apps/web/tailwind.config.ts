import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--background) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panel2: "rgb(var(--panel-2) / <alpha-value>)",
        panel3: "rgb(var(--panel-3) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        text: "rgb(var(--foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
      },
      boxShadow: {
        panel: "0 22px 60px rgba(2, 7, 12, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.035)",
      },
      fontFamily: {
        display: ["Geist", "var(--font-geist)", "sans-serif"],
        sans: ["Geist", "var(--font-geist)", "sans-serif"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "reveal-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "signal-pulse": { "0%, 100%": { opacity: "0.45" }, "50%": { opacity: "1" } },
      },
      animation: {
        "reveal-up": "reveal-up 700ms cubic-bezier(0.32,0.72,0,1) both",
        "signal-pulse": "signal-pulse 2.4s cubic-bezier(0.32,0.72,0,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
