import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // โทนสีแบรนด์ WYNNS (威力狮) — แดงสิงโต
        brand: {
          50: "#fdf3f2",
          100: "#fbe0dd",
          500: "#e2231a",
          600: "#c81a12",
          700: "#a3140e",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
