import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rappi: {
          orange: "#FF441F",
          "orange-dark": "#E03018",
          "orange-mid": "#FF6B35",
          "orange-light": "#FFF0ED",
          sidebar: "#1C1C2E",
          "sidebar-hover": "#2D2D44",
          dark: "#1A1A1A",
          muted: "#666666",
          surface: "#F5F5F5",
          "card-border": "#E8E8E8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
