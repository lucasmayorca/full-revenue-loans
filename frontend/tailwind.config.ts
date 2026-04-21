import type { Config } from "tailwindcss";

const uber = {
  black: "#000000",
  white: "#FFFFFF",
  "gray-100": "#F6F6F6",
  "gray-200": "#E8E8E8",
  "gray-300": "#D9D9D9",
  "gray-500": "#8A8A8A",
  "gray-700": "#4B4B4B",
  "gray-900": "#333333",
  hero: "#323942",
  green: "#06C167",
  "green-dark": "#049E52",
  success: "#0C5A34",
  "success-bg": "#E6F5EC",
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
      colors: {
        uber,
        // Backward-compat: aliasear tokens Rappi al nuevo paleta Uber para
        // permitir migración incremental sin romper referencias existentes.
        rappi: {
          orange: uber.black,
          "orange-dark": uber["gray-900"],
          "orange-mid": uber["gray-700"],
          "orange-light": uber["gray-100"],
          sidebar: uber.white,
          "sidebar-hover": uber["gray-100"],
          dark: uber.black,
          muted: uber["gray-500"],
          surface: uber["gray-100"],
          "card-border": uber["gray-200"],
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["40px", { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "32px", letterSpacing: "0.01em", fontWeight: "700" }],
        h3: ["18px", { lineHeight: "24px", fontWeight: "500" }],
        tab: ["14px", { lineHeight: "16px", letterSpacing: "0.03em" }],
      },
      borderRadius: {
        btn: "2px",
        card: "8px",
        pill: "32px",
      },
    },
  },
  plugins: [],
};

export default config;
