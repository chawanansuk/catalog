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
        // โทนสีแบรนด์ WYNN'S (威力狮) — เขียวเข้มตามโลโก้จริง
        brand: {
          50: "#eaf4ee",
          100: "#c6e2d2",
          500: "#227850",
          600: "#1d6b41",
          700: "#15512f",
        },
        // สีเน้นในโลโก้ — ลิ่มสีส้ม
        accent: {
          400: "#f7a823",
          500: "#f3941a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
