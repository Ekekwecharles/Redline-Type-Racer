import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        asphalt: { DEFAULT: "#0a0e14", 2: "#11161f", 3: "#171d29" },
        line: "#232b3a",
        violet: "#8b5cf6",
        cyan: "#22d3ee",
        pink: "#f43f5e",
        amber: "#fbbf24",
        fog: "#b7bec9",
        dim: "#6b7386",
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      keyframes: {
        dash: { from: { backgroundPositionX: "0" }, to: { backgroundPositionX: "-36px" } },
        fadein: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        dash: "dash 0.6s linear infinite",
        fadein: "fadein 0.25s ease",
      },
    },
  },
  plugins: [],
};
export default config;
