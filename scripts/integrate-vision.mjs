#!/usr/bin/env node
/**
 * เสียบผลลัพธ์จาก vision pipeline (pipeline/out) เข้าแอป:
 * - อ่าน pipeline/out/pages/p*.json (ข้อมูล + รหัส + variants)
 * - "isolate" รูปสินค้าจาก pipeline/out/images/{code}.jpg ให้เหลือเฉพาะตัวเครื่องมือ
 *   (ลบเส้นตาราง + เลือกก้อนพิกเซลที่ "ตัน" ใหญ่สุด = ตัวสินค้า ตัดหัวข้อ/ตัวอักษร/ป้ายทิ้ง)
 * - เซฟ public/catalog/{code}.jpg แล้ว map รหัสหลัก + รหัส variants → รูปเดียวกัน
 * - เขียน public/catalog-images.json (แทนของเดิม)
 *
 * ใช้: node scripts/integrate-vision.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";

const PAGES = "pipeline/out/pages";
const SRCIMG = "pipeline/out/images";
const OUT_DIR = "public/catalog";
const MAP_PATH = "public/catalog-images.json";

/** ดึงเฉพาะตัวเครื่องมือออกจากภาพ (largest solid connected component) */
async function isolate(srcPath, outPath) {
  const m0 = await sharp(srcPath).metadata();
  const W0 = m0.width, H0 = m0.height;
  const scale = 240 / W0;
  const { data, info } = await sharp(srcPath).resize({ width: 240 }).grayscale().raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const ink = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) ink[i] = data[i] < 232 ? 1 : 0;
  // ลบเส้นแนวนอนยาว (เส้นตาราง)
  for (let y = 0; y < H; y++) {
    let run = 0;
    for (let x = 0; x < W; x++) {
      if (ink[y * W + x]) run++;
      else { if (run > W * 0.55) for (let k = x - run; k < x; k++) ink[y * W + k] = 0; run = 0; }
    }
    if (run > W * 0.55) for (let k = W - run; k < W; k++) ink[y * W + k] = 0;
  }
  const seen = new Uint8Array(W * H), comps = [], stack = [];
  for (let s = 0; s < W * H; s++) {
    if (!ink[s] || seen[s]) continue;
    let area = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    stack.length = 0; stack.push(s); seen[s] = 1;
    while (stack.length) {
      const p = stack.pop(); const x = p % W, y = (p / W) | 0; area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && ink[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack.push(p - 1); }
      if (x < W - 1 && ink[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack.push(p + 1); }
      if (y > 0 && ink[p - W] && !seen[p - W]) { seen[p - W] = 1; stack.push(p - W); }
      if (y < H - 1 && ink[p + W] && !seen[p + W]) { seen[p + W] = 1; stack.push(p + W); }
    }
    const fill = area / ((x1 - x0 + 1) * (y1 - y0 + 1));
    comps.push({ area, x0, y0, x1, y1, fill });
  }
  if (!comps.length) { await sharp(srcPath).toFile(outPath); return; }
  const solid = comps.filter((c) => c.fill >= 0.30 && c.area >= W * H * 0.01);
  const pick = (solid.length ? solid : comps).sort((a, b) => b.area - a.area)[0];
  const pad = 6;
  const L = Math.max(0, Math.round(pick.x0 / scale) - pad);
  const T = Math.max(0, Math.round(pick.y0 / scale) - pad);
  const R = Math.min(W0, Math.round(pick.x1 / scale) + pad);
  const B = Math.min(H0, Math.round(pick.y1 / scale) + pad);
  await sharp(srcPath)
    .extract({ left: L, top: T, width: Math.max(1, R - L), height: Math.max(1, B - T) })
    .resize({ width: 420, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(outPath);
}

const codeOf = (s) => (String(s).match(/^[A-Za-z0-9][A-Za-z0-9\-/.]*/) || [""])[0];

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const map = {};
let done = 0, miss = 0;
const pageFiles = existsSync(PAGES) ? readdirSync(PAGES).filter((f) => f.endsWith(".json")) : [];
for (const pf of pageFiles) {
  const d = JSON.parse(readFileSync(`${PAGES}/${pf}`, "utf8"));
  if (d.is_product_page === false) continue;
  for (const p of d.products || []) {
    const code = p.code;
    if (!code) continue;
    const src = `${SRCIMG}/${code}.jpg`;
    if (!existsSync(src)) { miss++; continue; }
    const outName = `${code}.jpg`;
    try {
      await isolate(src, `${OUT_DIR}/${outName}`);
    } catch {
      await sharp(src).resize({ width: 420 }).jpeg({ quality: 82 }).toFile(`${OUT_DIR}/${outName}`);
    }
    const rel = `catalog/${outName}`;
    map[code] = rel;
    for (const v of p.variants || []) {
      const vc = codeOf(v);
      if (vc && !map[vc]) map[vc] = rel;
    }
    done++;
  }
}
writeFileSync(MAP_PATH, JSON.stringify(map));
console.log(`isolate+เสียบรูป: ${done} สินค้า, รหัสในแมป ${Object.keys(map).length}, ไม่มีรูป ${miss}`);
