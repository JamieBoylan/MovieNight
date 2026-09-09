import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1523",
        cream: "#fdf8f0",
      },
      fontFamily: {
        display: ["ui-rounded", "'Segoe UI Rounded'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pop: "0 4px 0 rgba(26,21,35,0.9)",
        "pop-sm": "0 2px 0 rgba(26,21,35,0.9)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        pop: "pop 0.18s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
