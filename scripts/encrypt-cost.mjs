#!/usr/bin/env node
/**
 * เข้ารหัส/เปลี่ยนรหัสผ่านของฟิลด์ "cost" (ราคาทุน) ใน public/wynns.json
 *
 * โหมดทำงาน (ตรวจอัตโนมัติ):
 *  1) เข้ารหัสครั้งแรก — ถ้าข้อมูลมี cost เป็นตัวเลข (plaintext)
 *  2) เปลี่ยนรหัส (rotate) — ถ้าข้อมูลมีแต่ costEnc (เข้ารหัสไว้แล้ว)
 *     ต้องใส่ OLD_COST_PASSPHRASE เพื่อถอดรหัสเก่าก่อน (กันข้อมูลหาย)
 *
 * ใช้ AES-256-GCM + PBKDF2-SHA256 (เข้ากับ Web Crypto ในเบราว์เซอร์)
 *
 * วิธีใช้:
 *   # ครั้งแรก (มี plaintext cost อยู่):
 *   COST_PASSPHRASE='ลับ' node scripts/encrypt-cost.mjs
 *
 *   # เปลี่ยนรหัส (ข้อมูลเข้ารหัสไว้แล้ว):
 *   OLD_COST_PASSPHRASE='เก่า' COST_PASSPHRASE='ใหม่' node scripts/encrypt-cost.mjs
 *
 * รหัสผ่านไม่ถูกเก็บในโปรเจค — ใช้แค่ตอนรันสคริปต์นี้ และตอนผู้บริหารปลดล็อกในเบราว์เซอร์
 */
import crypto from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ITERATIONS = 150000;
const DATA_PATH = "public/wynns.json";
const META_PATH = "public/cost-crypto.json";

const passphrase = process.env.COST_PASSPHRASE;
if (!passphrase) {
  console.error("กรุณาตั้งค่า COST_PASSPHRASE (รหัสผ่านใหม่)");
  process.exit(1);
}

function deriveKey(pp, salt) {
  return crypto.pbkdf2Sync(pp, salt, ITERATIONS, 32, "sha256");
}

/** เข้ารหัส → base64(iv | ciphertext | tag) */
function encrypt(key, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString("base64");
}

/** ถอดรหัส base64(iv | ciphertext | tag) → string */
function decrypt(key, b64) {
  const raw = Buffer.from(b64, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(raw.length - 16);
  const ct = raw.subarray(12, raw.length - 16);
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

const products = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const hasPlain = products.some((p) => typeof p.cost === "number");
const hasEnc = products.some((p) => p.costEnc != null);

// --- ถ้าเป็นโหมด rotate: ถอดรหัสเก่ากลับเป็น plaintext ก่อน ---
if (!hasPlain && hasEnc) {
  const oldPp = process.env.OLD_COST_PASSPHRASE;
  if (!oldPp) {
    console.error(
      "ข้อมูลถูกเข้ารหัสไว้แล้ว — ต้องใส่ OLD_COST_PASSPHRASE (รหัสเก่า) เพื่อเปลี่ยนรหัส"
    );
    process.exit(1);
  }
  if (!existsSync(META_PATH)) {
    console.error(`ไม่พบ ${META_PATH} — ถอดรหัสเก่าไม่ได้`);
    process.exit(1);
  }
  const oldMeta = JSON.parse(readFileSync(META_PATH, "utf8"));
  const oldKey = deriveKey(oldPp, Buffer.from(oldMeta.salt, "base64"));
  // ตรวจรหัสเก่าก่อนด้วยค่าตรวจสอบ
  try {
    if (decrypt(oldKey, oldMeta.check) !== "WYNNS-COST-OK") throw new Error();
  } catch {
    console.error("OLD_COST_PASSPHRASE ไม่ถูกต้อง — ยกเลิก (ไม่แก้ไขข้อมูล)");
    process.exit(1);
  }
  for (const p of products) {
    if (p.costEnc != null) {
      p.cost = Number(decrypt(oldKey, p.costEnc));
    }
    delete p.costEnc;
  }
  console.log("ถอดรหัสเก่าเรียบร้อย — กำลังเข้ารหัสด้วยรหัสใหม่");
}

// --- เข้ารหัสด้วยรหัสใหม่ ---
const salt = crypto.randomBytes(16);
const key = deriveKey(passphrase, salt);

let count = 0;
for (const p of products) {
  if (typeof p.cost === "number") {
    p.costEnc = encrypt(key, p.cost);
    count++;
  } else {
    p.costEnc = null;
  }
  delete p.cost;
}

writeFileSync(DATA_PATH, JSON.stringify(products));
writeFileSync(
  META_PATH,
  JSON.stringify(
    {
      algo: "AES-256-GCM",
      kdf: "PBKDF2-SHA256",
      iterations: ITERATIONS,
      salt: salt.toString("base64"),
      check: encrypt(key, "WYNNS-COST-OK"),
    },
    null,
    2
  )
);

console.log(`เข้ารหัสราคาทุนสำเร็จ ${count} รายการ`);
console.log(`เขียน ${DATA_PATH} และ ${META_PATH} แล้ว`);
