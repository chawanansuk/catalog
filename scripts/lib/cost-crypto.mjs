/**
 * ฟังก์ชันเข้ารหัส/ถอดรหัสราคาทุน (ใช้ร่วมกันระหว่างสคริปต์ฝั่ง Node)
 * AES-256-GCM + PBKDF2-SHA256 — เข้ากันกับ Web Crypto ในเบราว์เซอร์ (src/lib/cost-crypto.ts)
 */
import crypto from "node:crypto";

export const ITERATIONS = 150000;
export const SENTINEL = "WYNNS-COST-OK";

export function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, 32, "sha256");
}

/** เข้ารหัส → base64(iv | ciphertext | tag) */
export function encrypt(key, plaintext) {
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
export function decrypt(key, b64) {
  const raw = Buffer.from(b64, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(raw.length - 16);
  const ct = raw.subarray(12, raw.length - 16);
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

/**
 * เข้ารหัสฟิลด์ cost ของทุก product (in-place) แล้วคืน meta สำหรับ cost-crypto.json
 * - product ที่ cost เป็นตัวเลข → ใส่ costEnc, ลบ cost
 * - product ที่ไม่มี cost → costEnc = null
 */
export function encryptCosts(products, passphrase) {
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
  const meta = {
    algo: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: salt.toString("base64"),
    check: encrypt(key, SENTINEL),
  };
  return { count, meta };
}
