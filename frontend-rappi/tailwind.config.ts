import type { Config } from "tailwindcss";

const rappi = {
  orange: "#FF441F",
  "orange-dark": "#E03518",
  "orange-mid": "#FF6B4A",
  "orange-light": "#FFF3F0",
  dark: "#332927",
  muted: "#706967",
  "gray-100": "#F5F5F5",
  "gray-200": "#E8E8E8",
  "gray-300": "#D9D9D9",
  "gray-500": "#9E9E9E",
  "gray-700": "#706967",
  "gray-900": "#332927",
  white: "#FFFFFF",
  sidebar: "#FFFFFF",
  "sidebar-hover": "#FFF3F0",
  surface: "#F5F5F5",
  "card-border": "#E8E8E8",
  success: "#00A650",
  "success-bg": "#E6F7ED",
  danger: "#E11900",
  "danger-bg": "#FDEBE9",
};

// Keep uber alias for shared components that still reference uber-* tokens
const uber = {
  black: "#332927",
  white: "#FFFFFF",
  "gray-100": "#F5F5F5",
  "gray-200": "#E8E8E8",
  "gray-300": "#D9D9D9",
  "gray-500": "#9E9E9E",
  "gray-700": "#706967",
  "gray-900": "#332927",
  hero: "#332927",
  green: "#FF441F",        // map green → rappi orange so CTA buttons stay orange
  "green-dark": "#E03518",
  success: "#00A650",
  "success-bg": "#E6F7ED",
  danger: "#E11900",
  "danger-bg": "#FDEBE9",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: { rappi, uber },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["40px", { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "32px", letterSpacing: "0.01em", fontWeight: "700" }],
        h3: ["18px", { lineHeight: "24px", fontWeight: "500" }],
        tab: ["14px", { lineHeight: "16px", letterSpacing: "0.03em" }],
      },
      borderRadius: {
        btn: "4px",
        card: "8px",
        pill: "32px",
      },
    },
  },
  plugins: [],
};

export default config;
