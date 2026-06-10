#!/usr/bin/env node
/**
 * สร้างไอคอน PWA จาก SVG (วาดตัว W เป็น vector ไม่พึ่งฟอนต์)
 * รัน: node scripts/gen-icons.mjs  → เขียนไฟล์ลง public/icons/
 *
 * ถ้ามีไฟล์โลโก้จริงในอนาคต สามารถแก้ SVG ด้านล่าง หรือชี้ sharp ไปที่ไฟล์โลโก้แทนได้
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const GREEN = "#1d6b41";
const ORANGE = "#f3941a";

/** ไอคอนสี่เหลี่ยม: พื้นเขียว + ตัว W ขาว + ลิ่มส้ม (safe zone สำหรับ maskable) */
function svg(size, { bg = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  ${bg ? `<rect width="512" height="512" fill="${GREEN}"/>` : ""}
  <polyline points="120,150 196,385 256,255 316,385 392,150"
    fill="none" stroke="#ffffff" stroke-width="46"
    stroke-linejoin="round" stroke-linecap="round"/>
  <polygon points="300,150 360,150 330,210" fill="${ORANGE}"/>
</svg>`;
}

mkdirSync("public/icons", { recursive: true });

async function render(svgStr, size, out) {
  await sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(out);
  console.log("เขียน", out);
}

await render(svg(512), 512, "public/icons/icon-512.png");
await render(svg(192), 192, "public/icons/icon-192.png");
await render(svg(512), 512, "public/icons/maskable-512.png");
await render(svg(180), 180, "public/icons/apple-touch-icon.png");
// favicon เล็ก
await render(svg(48), 48, "public/icons/favicon-48.png");

console.log("เสร็จ");
