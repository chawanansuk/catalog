/**
 * ถอดรหัส "ราคาทุน" ฝั่งเบราว์เซอร์ด้วย Web Crypto (AES-256-GCM + PBKDF2)
 *
 * ราคาทุนถูกเข้ารหัสไว้ในข้อมูล (ดู scripts/encrypt-cost.mjs) คนทั่วไปจะเห็นแค่
 * ข้อความที่อ่านไม่ออก ผู้บริหารกรอกรหัสผ่านเพื่อ derive คีย์แล้วถอดรหัสดูเอง
 * รหัสผ่านไม่เคยถูกส่งไปไหนหรือเก็บถาวร (เก็บแค่ใน sessionStorage ระหว่างเปิดแท็บ)
 */

export type CostCryptoMeta = {
  algo: string;
  kdf: string;
  iterations: number;
  salt: string;
  check: string;
};

const SENTINEL = "WYNNS-COST-OK";

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function loadCostMeta(): Promise<CostCryptoMeta> {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const res = await fetch(`${base}/cost-crypto.json`);
  return res.json();
}

export async function deriveKey(
  passphrase: string,
  meta: CostCryptoMeta
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: base64ToBytes(meta.salt),
      iterations: meta.iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptString(key: CryptoKey, b64: string): Promise<string> {
  const raw = base64ToBytes(b64);
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plain);
}

/** ตรวจว่ารหัสผ่าน (คีย์) ถูกต้องหรือไม่ โดยลองถอดค่าตรวจสอบ */
export async function verifyKey(
  key: CryptoKey,
  meta: CostCryptoMeta
): Promise<boolean> {
  try {
    return (await decryptString(key, meta.check)) === SENTINEL;
  } catch {
    return false;
  }
}

/** ถอดรหัสราคาทุน → ตัวเลข (คืน null ถ้าถอดไม่ได้) */
export async function decryptCost(
  key: CryptoKey,
  costEnc: string
): Promise<number | null> {
  try {
    const value = Number(await decryptString(key, costEnc));
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
