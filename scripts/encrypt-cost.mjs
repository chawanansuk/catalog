#!/usr/bin/env node
/**
 * เข้ารหัสฟิลด์ "cost" (ราคาทุน) ใน public/wynns.json
 *
 * - อ่าน public/wynns.json (ที่มี cost เป็นตัวเลข)
 * - เข้ารหัสแต่ละ cost ด้วย AES-256-GCM โดยใช้คีย์ที่ derive จากรหัสผ่าน (PBKDF2-SHA256)
 * - ลบ cost ตัวเลขออก เหลือเฉพาะ costEnc (base64 ของ iv|ciphertext|tag)
 * - เขียนพารามิเตอร์ (salt, iterations, ค่าตรวจสอบรหัสผ่าน) ไปที่ public/cost-crypto.json
 *
 * วิธีใช้:
 *   COST_PASSPHRASE='รหัสผ่านลับ' node scripts/encrypt-cost.mjs
 *
 * รหัสผ่านนี้ "ไม่ถูกเก็บ" ในโปรเจค — ใช้แค่ตอนเข้ารหัส (ที่นี่) และตอนผู้บริหารปลดล็อก (ในเบราว์เซอร์)
 * เปลี่ยนรหัสผ่าน = รันสคริปต์นี้ใหม่ด้วยรหัสใหม่ แล้ว commit + push
 */
import crypto from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const passphrase = process.env.COST_PASSPHRASE;
if (!passphrase) {
  console.error("กรุณาตั้งค่า COST_PASSPHRASE ก่อน เช่น:");
  console.error("  COST_PASSPHRASE='your-secret' node scripts/encrypt-cost.mjs");
  process.exit(1);
}

const ITERATIONS = 150000;
const salt = crypto.randomBytes(16);
const key = crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, 32, "sha256");

/** เข้ารหัสข้อความ → base64(iv | ciphertext | tag) (รูปแบบที่ Web Crypto AES-GCM ถอดได้) */
function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString("base64");
}

const path = "public/wynns.json";
const products = JSON.parse(readFileSync(path, "utf8"));

let encrypted = 0;
for (const p of products) {
  if (p.cost != null) {
    p.costEnc = encrypt(p.cost);
    encrypted++;
  } else {
    p.costEnc = null;
  }
  delete p.cost; // เอาราคาทุนแบบ plaintext ออก
}

writeFileSync(path, JSON.stringify(products));

// ค่าตรวจสอบรหัสผ่าน: ถอดได้ = รหัสถูก
const meta = {
  algo: "AES-256-GCM",
  kdf: "PBKDF2-SHA256",
  iterations: ITERATIONS,
  salt: salt.toString("base64"),
  check: encrypt("WYNNS-COST-OK"),
};
writeFileSync("public/cost-crypto.json", JSON.stringify(meta, null, 2));

console.log(`เข้ารหัสราคาทุนสำเร็จ ${encrypted} รายการ`);
console.log("เขียน public/wynns.json และ public/cost-crypto.json แล้ว");
