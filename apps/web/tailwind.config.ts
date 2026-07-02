import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f19",
        panel: "#161b22",
        panel2: "#1c2128",
        panel3: "#20262f",
        line: "#30363d",
        text: "#e0e2ee",
        muted: "#9ca3b4",
        accent: "#0070ff",
        accent2: "#8957e5",
        warning: "#ff8b3d",
        danger: "#f85149",
        success: "#2dd4bf",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0, 112, 255, 0.16), 0 16px 40px rgba(0, 0, 0, 0.45)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
