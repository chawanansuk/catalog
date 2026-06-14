#!/usr/bin/env node
/**
 * สร้าง public/catalog-info.json จากผล vision (pipeline/out/pages)
 * map: code (+ variants) -> { name_th, features_th[], material_th, hardness }
 * ใช้เสริมข้อมูลไทย/จุดเด่นในการ์ดสินค้า (ราคายังใช้จากไฟล์ราคาเดิม)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";

const PAGES = "pipeline/out/pages";
const codeOf = (s) => (String(s).match(/^[A-Za-z0-9][A-Za-z0-9\-/.]*/) || [""])[0];

const info = {};
for (const pf of readdirSync(PAGES).filter((f) => f.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(`${PAGES}/${pf}`, "utf8"));
  if (d.is_product_page === false) continue;
  for (const p of d.products || []) {
    if (!p.code) continue;
    const rec = {};
    if (p.name_th) rec.name_th = p.name_th;
    if (Array.isArray(p.features_th) && p.features_th.length)
      rec.features = p.features_th.slice(0, 4);
    if (p.material_th) rec.material = p.material_th;
    if (p.hardness) rec.hardness = p.hardness;
    if (Object.keys(rec).length === 0) continue;
    if (!info[p.code]) info[p.code] = rec;
    for (const v of p.variants || []) {
      const vc = codeOf(v);
      if (vc && !info[vc]) info[vc] = rec;
    }
  }
}

writeFileSync("public/catalog-info.json", JSON.stringify(info));
console.log("catalog-info: รหัส", Object.keys(info).length);
