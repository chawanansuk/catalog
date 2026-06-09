import type { NextConfig } from "next";

// ตั้ง BASE_PATH ตอน build บน GitHub Pages (project page อยู่ใต้ /<repo>)
// เช่น BASE_PATH=/catalog — ดู .github/workflows/deploy.yml
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export", // สร้างเป็น static HTML — โฮสต์ที่ไหนก็ได้ ไม่ต้องมีเซิร์ฟเวอร์
  basePath: basePath || undefined,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    // เวอร์ชันข้อมูล (เปลี่ยนทุก build) ใช้ต่อท้าย URL กัน cache ของไฟล์ json
    NEXT_PUBLIC_DATA_VERSION: String(Date.now()),
  },
};

export default nextConfig;
