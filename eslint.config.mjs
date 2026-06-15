import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  // lint เฉพาะแอปใน src — ข้ามโค้ดเครื่องมือ/ผลลัพธ์ build
  {
    ignores: [
      "pipeline/**",
      "scripts/**",
      "out/**",
      ".next/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
