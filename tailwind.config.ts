import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        primarylight: "var(--primary-light)",
        secondary: "var(--secondary)",
        background: "var(--background)",
        border: "var(--border)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;
