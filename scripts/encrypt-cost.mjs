#!/usr/bin/env node
/**
 * เข้ารหัส/เปลี่ยนรหัสผ่านของฟิลด์ "cost" (ราคาทุน) ใน public/wynns.json
 *
 * โหมดทำงาน (ตรวจอัตโนมัติ):
 *  1) เข้ารหัสครั้งแรก — ถ้าข้อมูลมี cost เป็นตัวเลข (plaintext)
 *  2) เปลี่ยนรหัส (rotate) — ถ้าข้อมูลมีแต่ costEnc (เข้ารหัสไว้แล้ว)
 *     ต้องใส่ OLD_COST_PASSPHRASE เพื่อถอดรหัสเก่าก่อน (กันข้อมูลหาย)
 *
 * วิธีใช้:
 *   COST_PASSPHRASE='ลับ' node scripts/encrypt-cost.mjs
 *   OLD_COST_PASSPHRASE='เก่า' COST_PASSPHRASE='ใหม่' node scripts/encrypt-cost.mjs
 *
 * หมายเหตุ: ถ้าต้องการนำเข้าจาก Excel ใหม่ ใช้ scripts/import-excel.mjs (เข้ารหัสให้ในตัว)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { deriveKey, decrypt, encryptCosts, SENTINEL } from "./lib/cost-crypto.mjs";

const DATA_PATH = "public/wynns.json";
const META_PATH = "public/cost-crypto.json";

const passphrase = process.env.COST_PASSPHRASE;
if (!passphrase) {
  console.error("กรุณาตั้งค่า COST_PASSPHRASE (รหัสผ่านใหม่)");
  process.exit(1);
}

const products = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const hasPlain = products.some((p) => typeof p.cost === "number");
const hasEnc = products.some((p) => p.costEnc != null);

// --- โหมด rotate: ถอดรหัสเก่ากลับเป็น plaintext ก่อน ---
if (!hasPlain && hasEnc) {
  const oldPp = process.env.OLD_COST_PASSPHRASE;
  if (!oldPp) {
    console.error("ข้อมูลถูกเข้ารหัสไว้แล้ว — ต้องใส่ OLD_COST_PASSPHRASE (รหัสเก่า) เพื่อเปลี่ยนรหัส");
    process.exit(1);
  }
  if (!existsSync(META_PATH)) {
    console.error(`ไม่พบ ${META_PATH} — ถอดรหัสเก่าไม่ได้`);
    process.exit(1);
  }
  const oldMeta = JSON.parse(readFileSync(META_PATH, "utf8"));
  const oldKey = deriveKey(oldPp, Buffer.from(oldMeta.salt, "base64"));
  try {
    if (decrypt(oldKey, oldMeta.check) !== SENTINEL) throw new Error();
  } catch {
    console.error("OLD_COST_PASSPHRASE ไม่ถูกต้อง — ยกเลิก (ไม่แก้ไขข้อมูล)");
    process.exit(1);
  }
  for (const p of products) {
    if (p.costEnc != null) p.cost = Number(decrypt(oldKey, p.costEnc));
    delete p.costEnc;
  }
  console.log("ถอดรหัสเก่าเรียบร้อย — กำลังเข้ารหัสด้วยรหัสใหม่");
}

const { count, meta } = encryptCosts(products, passphrase);

writeFileSync(DATA_PATH, JSON.stringify(products));
writeFileSync(META_PATH, JSON.stringify(meta, null, 2));

console.log(`เข้ารหัสราคาทุนสำเร็จ ${count} รายการ`);
console.log(`เขียน ${DATA_PATH} และ ${META_PATH} แล้ว`);
