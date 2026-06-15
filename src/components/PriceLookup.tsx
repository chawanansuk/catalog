"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchProducts, type WynnsProduct } from "@/lib/products";
import { formatBaht } from "@/lib/format";
import {
  deriveKey,
  decryptCost,
  loadCostMeta,
  verifyKey,
  type CostCryptoMeta,
} from "@/lib/cost-crypto";

const SESSION_KEY = "wynns_cost_pp";

function PriceRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: number | null;
  highlight?: boolean;
}) {
  if (value == null) return null;
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
        highlight ? "bg-brand-50" : "bg-gray-50"
      }`}
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`font-semibold ${
          highlight ? "text-brand-700" : "text-gray-900"
        }`}
      >
        {formatBaht(value)}
      </span>
    </div>
  );
}

/** แถวราคาทุน — แสดงเฉพาะเมื่อปลดล็อกโหมดผู้บริหาร */
function CostRow({
  unlocked,
  cost,
  hasCost,
}: {
  unlocked: boolean;
  cost: number | null | undefined;
  hasCost: boolean;
}) {
  // คนทั่วไป (ยังไม่ปลดล็อก) จะไม่เห็นบรรทัดราคาทุนเลย
  if (!unlocked || !hasCost) return null;
  return (
    <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
      <span className="text-sm text-gray-600">ราคาทุน</span>
      <span className="font-semibold text-brand-700">
        {cost == null ? "…" : formatBaht(cost)}
      </span>
    </div>
  );
}

/** % กำไรขั้นต้นบนราคาขาย = (ขาย - ทุน) / ขาย × 100 */
function marginPct(sell: number, cost: number): number {
  if (sell <= 0) return 0;
  return Math.round(((sell - cost) / sell) * 100);
}

/** บรรทัดกำไร (เฉพาะโหมดผู้บริหารและรู้ราคาทุน) */
function MarginRow({
  cost,
  product,
}: {
  cost: number;
  product: WynnsProduct;
}) {
  const parts: string[] = [];
  if (product.wholesale != null)
    parts.push(`ส่ง ${marginPct(product.wholesale, cost)}%`);
  if (product.retail != null)
    parts.push(`ปลีก ${marginPct(product.retail, cost)}%`);
  if (parts.length === 0) return null;
  return (
    <p className="sm:col-span-2 px-1 text-xs text-gray-500">
      กำไรขั้นต้น — {parts.join(" · ")}
    </p>
  );
}

/** ปุ่มคัดลอกข้อมูลราคา (สำหรับส่งให้ลูกค้า/ทีม) */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* เบราว์เซอร์เก่าอาจไม่รองรับ */
        }
      }}
      className="shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 transition hover:border-brand-500 hover:text-brand-600"
    >
      {copied ? "คัดลอกแล้ว ✓" : "คัดลอก"}
    </button>
  );
}

function buildCopyText(
  product: WynnsProduct,
  unlocked: boolean,
  cost: number | null | undefined
): string {
  const lines: string[] = [];
  lines.push(`${product.code ?? ""} ${product.name}`.trim());
  if (unlocked && cost != null) lines.push(`ราคาทุน: ${formatBaht(cost)}`);
  if (product.wholesaleSpecial != null)
    lines.push(`ขายส่งพิเศษ: ${formatBaht(product.wholesaleSpecial)}`);
  if (product.wholesale != null)
    lines.push(`ขายส่ง: ${formatBaht(product.wholesale)}`);
  if (product.retail != null)
    lines.push(`ราคาปลีก: ${formatBaht(product.retail)}`);
  return lines.join("\n");
}

function ProductResult({
  product,
  unlocked,
  cost,
  image,
  info,
}: {
  product: WynnsProduct;
  unlocked: boolean;
  cost: number | null | undefined;
  image?: string;
  info?: { features?: string[]; material?: string; hardness?: string };
}) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {product.code && (
            <span className="rounded-md bg-brand-600 px-2 py-1 font-mono text-sm font-bold text-white">
              {product.code}
            </span>
          )}
          {product.isNew && (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              สินค้าใหม่
            </span>
          )}
          {product.unit && (
            <span className="text-xs text-gray-400">/ {product.unit}</span>
          )}
        </div>
        <CopyButton text={buildCopyText(product, unlocked, cost)} />
      </div>

      <h3 className="mt-2 font-medium text-gray-900">{product.name}</h3>
      {product.nameZh && (
        <p className="mt-0.5 text-xs text-gray-400">{product.nameZh}</p>
      )}

      {image && (
        <a
          href={`${base}/${image}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block overflow-hidden rounded-lg border border-gray-100 bg-white"
          title="แตะเพื่อดูภาพเต็มจากแคตตาล็อก"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}/${image}`}
            alt={`รูปแคตตาล็อก ${product.code ?? ""}`}
            loading="lazy"
            className="mx-auto max-h-52 w-full object-contain"
          />
        </a>
      )}

      {info?.features && info.features.length > 0 && (
        <ul className="mt-2 space-y-1">
          {info.features.map((f, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-gray-600">
              <span className="text-brand-500">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {(info?.material || info?.hardness) && (
        <p className="mt-1.5 text-xs text-gray-400">
          {[info.material, info.hardness].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <CostRow
          unlocked={unlocked}
          cost={cost}
          hasCost={product.costEnc != null}
        />
        <PriceRow label="ขายส่งพิเศษ" value={product.wholesaleSpecial} />
        <PriceRow label="ขายส่ง" value={product.wholesale} />
        <PriceRow label="ราคาขายปลีก" value={product.retail} />
        {unlocked && cost != null && (
          <MarginRow cost={cost} product={product} />
        )}
      </div>
    </div>
  );
}

function ExecUnlock({
  unlocked,
  onUnlock,
  onLogout,
}: {
  unlocked: boolean;
  onUnlock: (passphrase: string) => Promise<boolean>;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (unlocked) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50 px-4 py-2 text-sm">
        <span className="font-medium text-brand-700">
          🔓 โหมดผู้บริหาร — เห็นราคาทุน
        </span>
        <button
          onClick={onLogout}
          className="font-medium text-gray-500 hover:text-gray-700"
        >
          ออกจากระบบ
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-gray-400 hover:text-brand-600"
      >
        🔒 สำหรับผู้บริหาร
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(false);
        const ok = await onUnlock(passphrase);
        setBusy(false);
        if (ok) {
          setPassphrase("");
          setOpen(false);
        } else {
          setError(true);
        }
      }}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
    >
      <span className="text-sm font-medium text-gray-600">🔒 รหัสผู้บริหาร:</span>
      <input
        type="password"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        autoFocus
        placeholder="กรอกรหัสผ่าน"
        className={`flex-1 rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-100 ${
          error ? "border-red-400" : "border-gray-300 focus:border-brand-500"
        }`}
      />
      <button
        type="submit"
        disabled={busy || !passphrase}
        className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:bg-gray-300"
      >
        {busy ? "กำลังตรวจสอบ…" : "ปลดล็อก"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError(false);
          setPassphrase("");
        }}
        className="text-sm text-gray-400 hover:text-gray-600"
      >
        ยกเลิก
      </button>
      {error && (
        <p className="w-full text-xs text-red-500">รหัสผ่านไม่ถูกต้อง</p>
      )}
    </form>
  );
}

export function PriceLookup() {
  const [allProducts, setAllProducts] = useState<WynnsProduct[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // โหมดผู้บริหาร (ถอดรหัสราคาทุน)
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const metaRef = useRef<CostCryptoMeta | null>(null);
  const [costMap, setCostMap] = useState<Record<string, number | null>>({});

  // map รหัส → รูปจากแคตตาล็อก
  const [catalogImages, setCatalogImages] = useState<Record<string, string>>({});
  // map รหัส → ข้อมูลไทย (จุดเด่น/วัสดุ) จาก vision
  const [catalogInfo, setCatalogInfo] = useState<
    Record<string, { features?: string[]; material?: string; hardness?: string }>
  >({});

  // โหลดข้อมูลครั้งเดียวตอนเปิดหน้า แล้วค้นหาในเบราว์เซอร์ทั้งหมด (ไม่ต้องมีเซิร์ฟเวอร์)
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const v = process.env.NEXT_PUBLIC_DATA_VERSION ?? "";
    fetch(`${base}/wynns.json?v=${v}`)
      .then((res) => res.json())
      .then((data: WynnsProduct[]) => {
        setAllProducts(data);
        setDataReady(true);
      })
      .catch(() => setDataReady(true));

    fetch(`${base}/catalog-images.json?v=${v}`)
      .then((res) => res.json())
      .then((m: Record<string, string>) => setCatalogImages(m))
      .catch(() => {
        /* ไม่มีรูปก็ไม่เป็นไร */
      });

    fetch(`${base}/catalog-info.json?v=${v}`)
      .then((res) => res.json())
      .then((m) => setCatalogInfo(m))
      .catch(() => {
        /* ไม่มีข้อมูลเสริมก็ไม่เป็นไร */
      });
  }, []);

  const getMeta = useCallback(async () => {
    if (!metaRef.current) metaRef.current = await loadCostMeta();
    return metaRef.current;
  }, []);

  const unlock = useCallback(
    async (passphrase: string): Promise<boolean> => {
      try {
        const meta = await getMeta();
        const key = await deriveKey(passphrase, meta);
        if (!(await verifyKey(key, meta))) return false;
        setCryptoKey(key);
        sessionStorage.setItem(SESSION_KEY, passphrase);
        return true;
      } catch {
        return false;
      }
    },
    [getMeta]
  );

  const logout = useCallback(() => {
    setCryptoKey(null);
    setCostMap({});
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  // ปลดล็อกอัตโนมัติถ้าเคยกรอกรหัสไว้ในเซสชันนี้
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) unlock(saved);
  }, [unlock]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(query), 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const results = useMemo(
    () => searchProducts(debounced, allProducts),
    [debounced, allProducts]
  );

  // ถอดรหัสราคาทุนของผลลัพธ์ที่ยังไม่ได้ถอด (เมื่ออยู่ในโหมดผู้บริหาร)
  useEffect(() => {
    if (!cryptoKey) return;
    let cancelled = false;
    (async () => {
      const todo = results.filter(
        (p) => p.costEnc && !(p.costEnc in costMap)
      );
      if (todo.length === 0) return;
      const entries = await Promise.all(
        todo.map(async (p) => [
          p.costEnc as string,
          await decryptCost(cryptoKey, p.costEnc as string),
        ] as const)
      );
      if (cancelled) return;
      setCostMap((prev) => {
        const next = { ...prev };
        for (const [enc, val] of entries) next[enc] = val;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [cryptoKey, results, costMap]);

  const searched = debounced.trim().length > 0;
  const unlocked = cryptoKey != null;

  return (
    <div className="space-y-5">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          disabled={!dataReady}
          placeholder={
            dataReady
              ? "พิมพ์รหัสสินค้า เช่น WSB230B หรือชื่อสินค้า..."
              : "กำลังโหลดข้อมูลสินค้า..."
          }
          className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
        />
      </div>

      <ExecUnlock unlocked={unlocked} onUnlock={unlock} onLogout={logout} />

      {dataReady && (
        <p className="text-sm text-gray-500">
          ฐานข้อมูล {allProducts.length.toLocaleString("th-TH")} รายการ
          {searched &&
            (results.length >= 50
              ? ` • พบมากกว่า 50 รายการ — แสดง 50 แรก (พิมพ์ให้เจาะจงขึ้น)`
              : ` • พบ ${results.length.toLocaleString("th-TH")} รายการ`)}
        </p>
      )}

      <div className="space-y-3">
        {results.map((product, i) => (
          <ProductResult
            key={`${product.code}-${i}`}
            product={product}
            unlocked={unlocked}
            cost={product.costEnc ? costMap[product.costEnc] : null}
            image={product.code ? catalogImages[product.code] : undefined}
            info={product.code ? catalogInfo[product.code] : undefined}
          />
        ))}
      </div>

      {searched && results.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
          ไม่พบสินค้าที่ตรงกับ &ldquo;{debounced}&rdquo;
        </div>
      )}
    </div>
  );
}
