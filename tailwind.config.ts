import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "ink" is the primary foreground color (text + borders) and "cream"
        // is the elevated-hover surface — both dark-theme values now, but
        // kept under these names since they're used all over the app as
        // text-ink/border-ink/hover:bg-cream.
        ink: "#f3eee2",
        cream: "#211c2f",
        // Page background vs. card/input background — two shades of near-
        // black so cards read as "raised" against the page.
        bg: "#0a0813",
        surface: "#151022",
        // Cinema-marquee gold, used for the score badge, IMDb rating chip,
        // and anywhere we want a warm highlight against the dark palette.
        marquee: "#f5c518",
      },
      fontFamily: {
        display: ["ui-rounded", "'Segoe UI Rounded'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pop: "0 4px 0 rgba(245,197,24,0.85)",
        "pop-sm": "0 2px 0 rgba(245,197,24,0.85)",
        glow: "0 0 40px rgba(245,197,24,0.15)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        pop: "pop 0.18s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
