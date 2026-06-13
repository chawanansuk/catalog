#!/usr/bin/env node
/**
 * ดึงรูปสินค้าจาก PDF แคตตาล็อก WYNNS → public/catalog/*.jpg
 * + จับคู่รหัสสินค้ากับรูป → public/catalog-images.json
 *
 * วิธีทำ: render แต่ละหน้า 300dpi → แบ่งคอลัมน์ (ตัดแถบไอคอนขวาออก) →
 * ตัดเป็น "การ์ดสินค้า" ตามตำแหน่งรูป (รูปมีสี / ตัวอักษรขาวดำ) โดยให้
 * title+รูป+ตาราง ของแต่ละชิ้นอยู่ด้วยกัน → OCR หารหัสในการ์ด → fuzzy-match
 * กับรหัสจริง (แก้ O↔0, I↔1, B↔8 ฯลฯ) → ย่อรูป 480px เก็บไว้แสดง
 *
 * ใช้: node scripts/extract-catalog.mjs path/to/catalog.pdf
 * ต้องมี: poppler-utils (pdftoppm), tesseract-ocr, sharp
 */
import sharp from "sharp";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";

const PDF = process.argv[2];
if (!PDF) { console.error("ใช้: node scripts/extract-catalog.mjs <catalog.pdf>"); process.exit(1); }

const OUT_DIR = "public/catalog";
const TMP = "/tmp/_catalog_extract";
rmSync(OUT_DIR, { recursive: true, force: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP, { recursive: true });

// --- รหัสจริง + ตัว normalize แก้ความสับสนของ OCR ---
const products = JSON.parse(readFileSync("public/wynns.json", "utf8"));
const confuse = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "")
  .replace(/O|Q/g, "0").replace(/I|L/g, "1").replace(/B/g, "8")
  .replace(/S/g, "5").replace(/Z/g, "2").replace(/G/g, "6");
const normMap = new Map();
for (const p of products) {
  if (!p.code) continue;
  const n = confuse(p.code);
  if (normMap.has(n) && normMap.get(n) !== p.code) normMap.set(n, null);
  else if (!normMap.has(n)) normMap.set(n, p.code);
}

execSync(`pdftoppm -png -r 300 "${PDF}" "${TMP}/page"`, { stdio: "ignore" });
const pageFiles = readdirSync(TMP).filter((f) => f.endsWith(".png")).sort();
console.log("จำนวนหน้า:", pageFiles.length);

const codePattern = /[A-Z]{1,4}[0-9]{2,5}[A-Z0-9]{0,4}/g;
const map = {};
let blockTotal = 0, mappedCodes = 0;

async function segment(src) {
  const { width: W, height: H } = await sharp(src).metadata();
  const { data } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const f = W / 1075;
  const gray = (x, y) => { const i = (y * W + x) * 3; return (data[i] + data[i + 1] + data[i + 2]) / 3; };
  const colorful = (x, y) => {
    const i = (y * W + x) * 3, r = data[i], g = data[i + 1], b = data[i + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) > 38 && Math.max(r, g, b) > 60;
  };
  // คอลัมน์ซ้าย/ขวา + ตัดแถบไอคอนหมวดด้านขวา
  const colInk = new Array(W).fill(0);
  for (let x = 0; x < W; x++) { let s = 0; for (let y = 0; y < H; y++) if (gray(x, y) < 225) s++; colInk[x] = s; }
  let gutter = W >> 1, best = Infinity;
  for (let x = (W * 0.42) | 0; x < (W * 0.58) | 0; x++) if (colInk[x] < best) { best = colInk[x]; gutter = x; }
  let rightEdge = (W * 0.89) | 0, b2 = Infinity;
  for (let x = (W * 0.80) | 0; x < (W * 0.95) | 0; x++) if (colInk[x] < b2) { b2 = colInk[x]; rightEdge = x; }
  const cols = [[(W * 0.02) | 0, gutter - ((4 * f) | 0)], [gutter + ((4 * f) | 0), rightEdge]];
  const TITLE = Math.round(78 * f);
  const boxes = [];
  for (const [x0, x1] of cols) {
    const cw = x1 - x0;
    const cr = [];
    for (let y = 0; y < H; y++) { let s = 0; for (let x = x0; x < x1; x++) if (colorful(x, y)) s++; cr.push(s); }
    const thr = cw * 0.06;
    let bands = [], st = -1;
    for (let y = 0; y < H; y++) {
      const has = cr[y] > thr;
      if (has && st < 0) st = y;
      if (!has && st >= 0) { if (y - st > 20 * f) bands.push([st, y]); st = -1; }
    }
    if (st >= 0 && H - st > 20 * f) bands.push([st, H]);
    const mb = [];
    for (const bd of bands) {
      if (mb.length && bd[0] - mb[mb.length - 1][1] < 28 * f) mb[mb.length - 1][1] = bd[1];
      else mb.push([...bd]);
    }
    if (mb.length <= 1) { boxes.push({ left: x0, top: 0, width: cw, height: H }); continue; }
    for (let i = 0; i < mb.length; i++) {
      const T = Math.max(0, mb[i][0] - TITLE);
      const B = i < mb.length - 1 ? Math.max(T + 1, mb[i + 1][0] - TITLE) : H;
      boxes.push({ left: x0, top: T, width: cw, height: Math.min(H - T, B - T) });
    }
  }
  return boxes;
}

for (let i = 0; i < pageFiles.length; i++) {
  const src = `${TMP}/${pageFiles[i]}`;
  const pageNo = String(i + 1).padStart(2, "0");
  let bi = 0;
  const boxes = await segment(src);
  for (const box of boxes) {
    bi++;
    const name = `p${pageNo}-b${String(bi).padStart(2, "0")}.jpg`;
    const hiCrop = `${TMP}/crop.png`;
    try {
      await sharp(src).extract(box).trim({ background: "#ffffff", threshold: 18 }).toFile(hiCrop);
    } catch { await sharp(src).extract(box).toFile(hiCrop); }
    await sharp(hiCrop).resize({ width: 480, withoutEnlargement: true })
      .jpeg({ quality: 78 }).toFile(`${OUT_DIR}/${name}`);
    blockTotal++;
    let text = "";
    try { text = execSync(`tesseract "${hiCrop}" stdout --psm 6 2>/dev/null`, { encoding: "utf8" }); } catch {}
    const found = new Set();
    for (const tok of text.toUpperCase().match(codePattern) || []) {
      const code = normMap.get(confuse(tok));
      if (code) found.add(code);
    }
    for (const code of found) if (!map[code]) { map[code] = `catalog/${name}`; mappedCodes++; }
  }
  process.stdout.write(`\rหน้า ${i + 1}/${pageFiles.length} | บล็อก ${blockTotal} | จับคู่รหัส ${mappedCodes}   `);
}
console.log("");
writeFileSync("public/catalog-images.json", JSON.stringify(map));
console.log(`เสร็จ: ${blockTotal} บล็อก, จับคู่ได้ ${mappedCodes} รหัส`);
