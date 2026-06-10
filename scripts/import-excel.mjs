#!/usr/bin/env node
/**
 * นำเข้าไฟล์ราคา Excel ของ WYNNS → สร้าง public/wynns.json (เข้ารหัสราคาทุนแล้ว)
 * จบในคำสั่งเดียว: อ่าน Excel → ดึงรหัสรุ่น → เข้ารหัสราคาทุน → เขียนไฟล์ข้อมูล + meta
 *
 * วิธีใช้:
 *   COST_PASSPHRASE='รหัสผู้บริหาร' node scripts/import-excel.mjs path/to/price.xlsx
 *
 * โครงไฟล์ Excel ที่รองรับ:
 *   ชีต "บัญชีราคา (หลัก)" : ชื่อไทย | ชื่อจีน | หน่วย | ราคารวมภาษี | ราคาส่งออก | ราคาทุน | ขายส่งพิเศษ | ขายส่ง | ราคาขายปลีก
 *   ชีต "สินค้าใหม่"      : รหัสสินค้า | ชื่อไทย | ชื่อจีน | หน่วย | ราคารวมภาษี | หมายเหตุ
 *
 * หมายเหตุ: ราคารวมภาษี/ราคาส่งออก ไม่ถูกเก็บ (เว็บไม่แสดง) เพื่อลดขนาดไฟล์
 */
import { readFileSync, writeFileSync } from "node:fs";
import XLSX from "xlsx";
import { encryptCosts } from "./lib/cost-crypto.mjs";

const passphrase = process.env.COST_PASSPHRASE;
const inputPath = process.argv[2];

if (!passphrase || !inputPath) {
  console.error("วิธีใช้: COST_PASSPHRASE='รหัส' node scripts/import-excel.mjs <ไฟล์.xlsx>");
  process.exit(1);
}

const parenRe = /\(([^)]*)\)/g;

/** ดึงรหัสรุ่น WYNNS จากชื่อสินค้า (รองรับ "(WYNNS CODE)" และ "(CODE) wynns") */
function extractCode(name) {
  if (!name) return null;
  const s = String(name);
  for (const m of s.matchAll(parenRe)) {
    const cleaned = m[1]
      .replace(/威力狮/g, "")
      .replace(/\bwynns\b/gi, "")
      .trim();
    if (cleaned && /[A-Za-z0-9]/.test(cleaned)) {
      return cleaned.includes(" ") ? cleaned.split(/\s+/)[0] : cleaned;
    }
  }
  const m1 = s.match(/wynns\s+([A-Za-z0-9\-./]+)/i);
  if (m1) return m1[1];
  const m2 = s.match(/^\(?\s*([A-Za-z]*\d[A-Za-z0-9\-./]*)/);
  if (m2) return m2[1];
  return null;
}

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function str(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

const wb = XLSX.readFile(inputPath);
const products = [];

// --- ชีตหลัก ---
const main = wb.Sheets["บัญชีราคา (หลัก)"];
if (!main) {
  console.error('ไม่พบชีต "บัญชีราคา (หลัก)" ในไฟล์');
  process.exit(1);
}
const mainRows = XLSX.utils.sheet_to_json(main, { header: 1 });
for (const r of mainRows.slice(1)) {
  const name = str(r[0]);
  if (!name) continue;
  products.push({
    code: extractCode(name),
    name,
    nameZh: str(r[1]),
    unit: str(r[2]),
    cost: num(r[5]), // จะถูกเข้ารหัสด้านล่าง
    wholesaleSpecial: num(r[6]),
    wholesale: num(r[7]),
    retail: num(r[8]),
    isNew: false,
  });
}

// --- ชีตสินค้าใหม่ (ถ้ามี) ---
const fresh = wb.Sheets["สินค้าใหม่"];
if (fresh) {
  const freshRows = XLSX.utils.sheet_to_json(fresh, { header: 1 });
  for (const r of freshRows.slice(1)) {
    const name = str(r[1]);
    if (!name) continue;
    products.push({
      code: extractCode(name),
      altCode: str(r[0]),
      name,
      nameZh: str(r[2]),
      unit: str(r[3]),
      cost: null,
      wholesaleSpecial: null,
      wholesale: null,
      retail: null,
      isNew: true,
    });
  }
}

const { count, meta } = encryptCosts(products, passphrase);

writeFileSync("public/wynns.json", JSON.stringify(products));
writeFileSync("public/cost-crypto.json", JSON.stringify(meta, null, 2));

const missingCode = products.filter((p) => !p.code).length;
console.log(`นำเข้าสินค้า ${products.length} รายการ (ไม่มีรหัส ${missingCode})`);
console.log(`เข้ารหัสราคาทุน ${count} รายการ`);
console.log("เขียน public/wynns.json และ public/cost-crypto.json แล้ว");
