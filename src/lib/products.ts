export type WynnsProduct = {
  /** รหัสรุ่น WYNNS เช่น WSB230B (ดึงจากชื่อสินค้า) */
  code: string | null;
  /** รหัสภายในเพิ่มเติม (มีเฉพาะสินค้าใหม่ เช่น K04073) */
  altCode?: string | null;
  /** ชื่อสินค้าภาษาไทย */
  name: string;
  /** ชื่อเดิมภาษาจีน */
  nameZh?: string | null;
  /** หน่วยนับ เช่น ด้าม, อัน */
  unit?: string | null;
  /** ราคารวมภาษี (บาท) */
  priceIncVat?: number | null;
  /** ราคาส่งออก (บาท) */
  priceExport?: number | null;
  /** ราคาทุน */
  cost?: number | null;
  /** ขายส่งพิเศษ (ราคาขายพิเศษ) */
  wholesaleSpecial?: number | null;
  /** ขายส่ง */
  wholesale?: number | null;
  /** ราคาขายปลีก */
  retail?: number | null;
  /** เป็นสินค้าใหม่หรือไม่ */
  isNew: boolean;
};

/** normalize สำหรับเทียบรหัส: ตัดช่องว่าง/ขีด/อักขระพิเศษ และทำเป็นตัวพิมพ์ใหญ่ */
function normalizeCode(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

type ScoredProduct = { product: WynnsProduct; score: number };

/**
 * ค้นหาสินค้าด้วยรหัสหรือชื่อ
 * - รหัสตรงเป๊ะ > รหัสขึ้นต้นด้วย > รหัสมีคำนี้ > ชื่อมีคำนี้
 * - ไม่สนตัวพิมพ์เล็ก/ใหญ่ และเว้นวรรค (wsb230b = WSB230B = wsb 230b)
 */
export function searchProducts(
  query: string,
  products: WynnsProduct[],
  limit = 50
): WynnsProduct[] {
  const q = query.trim();
  if (!q) return [];

  const nq = normalizeCode(q);
  const lowerQ = q.toLowerCase();
  const results: ScoredProduct[] = [];

  for (const product of products) {
    const ncode = product.code ? normalizeCode(product.code) : "";
    const naltCode = product.altCode ? normalizeCode(product.altCode) : "";
    let score = 0;

    if (nq) {
      if (ncode === nq || naltCode === nq) {
        score = 100;
      } else if (ncode.startsWith(nq) || naltCode.startsWith(nq)) {
        score = 80;
      } else if (
        (ncode && ncode.includes(nq)) ||
        (naltCode && naltCode.includes(nq))
      ) {
        score = 60;
      }
    }

    if (score === 0 && product.name.toLowerCase().includes(lowerQ)) {
      score = 30;
    }

    if (score > 0) {
      results.push({ product, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map((r) => r.product);
}
