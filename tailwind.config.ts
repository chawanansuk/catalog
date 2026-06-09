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
        // โทนสีแบรนด์ WYNN'S (威力狮) — เขียวเข้ม (wordmark/เมนู) ตามเว็บจริง
        brand: {
          50: "#eaf6f0",
          100: "#c9e8d8",
          500: "#18935f",
          600: "#0f7a4d",
          700: "#0a5c3a",
        },
        // สีสิงโต/โลโก้ — แดง
        lion: {
          500: "#d32f2f",
          600: "#c1271f",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
