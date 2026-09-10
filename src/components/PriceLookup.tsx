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
import { CATEGORIES, categorize } from "@/lib/categories";
import { QuoteCart, type CartItem } from "@/components/QuoteCart";

const SESSION_KEY = "wynns_cost_pp";
const CART_KEY = "wynns_quote_cart";

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
  currentPrice,
}: {
  cost: number;
  product: WynnsProduct;
  currentPrice?: number;
}) {
  const parts: string[] = [];
  if (currentPrice != null)
    parts.push(`ตอนนี้ ${marginPct(currentPrice, cost)}%`);
  if (product.wholesale != null)
    parts.push(`ส่ง ${marginPct(product.wholesale, cost)}%`);
  if (currentPrice == null && product.retail != null)
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
  cost: number | null | undefined,
  currentPrice?: number
): string {
  const lines: string[] = [];
  lines.push(`${product.code ?? ""} ${product.name}`.trim());
  if (currentPrice != null) lines.push(`ราคาตอนนี้: ${formatBaht(currentPrice)}`);
  if (unlocked && cost != null) lines.push(`ราคาทุน: ${formatBaht(cost)}`);
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
  currentPrice,
  inCart,
  onAddToCart,
}: {
  product: WynnsProduct;
  unlocked: boolean;
  cost: number | null | undefined;
  image?: string;
  info?: { features?: string[]; material?: string; hardness?: string };
  currentPrice?: number;
  inCart: boolean;
  onAddToCart: () => void;
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
        <div className="flex shrink-0 items-center gap-1.5">
          <CopyButton
            text={buildCopyText(product, unlocked, cost, currentPrice)}
          />
          {product.code && (
            <button
              onClick={onAddToCart}
              disabled={inCart}
              className="rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {inCart ? "อยู่ในใบเสนอ ✓" : "＋ เสนอราคา"}
            </button>
          )}
        </div>
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
          className="mt-3 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white p-2"
          title="แตะเพื่อดูภาพเต็มจากแคตตาล็อก"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}/${image}`}
            alt={`รูปแคตตาล็อก ${product.code ?? ""}`}
            loading="lazy"
            /* max-* เท่านั้น — รูปเล็กแสดงขนาดจริง ไม่ถูกยืดจนเบลอ */
            className="max-h-full max-w-full object-contain"
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

      {currentPrice != null && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-amber-200">
          <span className="text-sm font-medium text-amber-800">ราคาตอนนี้</span>
          <span className="flex items-baseline gap-2">
            {product.retail != null && product.retail > currentPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatBaht(product.retail)}
              </span>
            )}
            <span className="text-lg font-bold text-amber-900">
              {formatBaht(currentPrice)}
            </span>
          </span>
        </div>
      )}

      {/* สินค้าที่ยังไม่มีราคาในระบบเลย — บอกให้ชัดแทนการ์ดโล่ง */}
      {currentPrice == null &&
      product.wholesale == null &&
      product.retail == null ? (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 text-center text-sm text-gray-500">
          ยังไม่มีราคาในระบบ — ติดต่อสอบถามราคา
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <CostRow
            unlocked={unlocked}
            cost={cost}
            hasCost={product.costEnc != null}
          />
          <PriceRow label="ขายส่ง" value={product.wholesale} />
          {/* ซ่อนราคาปลีกเดิมเมื่อมีราคาตอนนี้ (กันสับสน) */}
          {currentPrice == null && (
            <PriceRow label="ราคาขายปลีก" value={product.retail} />
          )}
          {unlocked && cost != null && (
            <MarginRow
              cost={cost}
              product={product}
              currentPrice={currentPrice}
            />
          )}
        </div>
      )}
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
  // map รหัส → ราคาขายตอนนี้ (แก้ไขได้ผ่านไฟล์ current-prices.json)
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});

  // หมวดหมู่ที่เลือก (null = ทั้งหมด)
  const [category, setCategory] = useState<string | null>(null);

  // ตะกร้าใบเสนอราคา (เก็บใน localStorage ให้อยู่ข้ามการเปิด-ปิด)
  const [cart, setCart] = useState<CartItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    // โหลดหลัง hydrate (หลีกเลี่ยง setState ระหว่าง effect ทำงาน)
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(CART_KEY);
        if (saved) setCart(JSON.parse(saved));
      } catch {
        /* ข้อมูลเสียก็เริ่มใหม่ */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* เต็มก็ข้าม */
    }
  }, [cart]);

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

    fetch(`${base}/current-prices.json?v=${v}`)
      .then((res) => res.json())
      .then((m: Record<string, number>) => setCurrentPrices(m))
      .catch(() => {
        /* ไม่มีราคาตอนนี้ก็ไม่เป็นไร */
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

  // แคชหมวดของแต่ละสินค้า (คำนวณครั้งเดียว)
  const productCats = useMemo(() => {
    const m = new Map<WynnsProduct, string>();
    for (const p of allProducts) m.set(p, categorize(p.name));
    return m;
  }, [allProducts]);

  // จำนวนสินค้าต่อหมวด (โชว์บน chip)
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const v of productCats.values()) c[v] = (c[v] ?? 0) + 1;
    return c;
  }, [productCats]);

  // เรียง chip ตามจำนวนสินค้า (มากไปน้อย) — หมวดใหญ่อยู่ต้นแถบ หาง่ายกว่า
  // ยกเว้น "อื่นๆ" ที่เป็นถังรวม ให้อยู่ท้ายสุดเสมอ
  const sortedCategories = useMemo(
    () =>
      CATEGORIES.filter((c) => (catCounts[c.key] ?? 0) > 0).sort((a, b) => {
        if (a.key === "other") return 1;
        if (b.key === "other") return -1;
        return (catCounts[b.key] ?? 0) - (catCounts[a.key] ?? 0);
      }),
    [catCounts]
  );

  // กรองตามหมวดก่อน แล้วค่อยค้นหาในหมวดนั้น
  const pool = useMemo(
    () =>
      category
        ? allProducts.filter((p) => productCats.get(p) === category)
        : allProducts,
    [category, allProducts, productCats]
  );

  const searched = debounced.trim().length > 0;

  const results = useMemo(() => {
    if (searched) return searchProducts(debounced, pool);
    if (category) return pool.slice(0, 50);
    return [];
  }, [debounced, pool, category, searched]);

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

  const unlocked = cryptoKey != null;

  const addToCart = useCallback(
    (p: WynnsProduct) => {
      if (!p.code) return;
      const code = p.code;
      const price =
        currentPrices[code] ?? p.retail ?? p.wholesale ?? 0;
      setCart((prev) =>
        prev.some((it) => it.code === code)
          ? prev
          : [
              ...prev,
              { code, name: p.name, unit: p.unit ?? undefined, price, qty: 1 },
            ]
      );
    },
    [currentPrices]
  );
  const cartCodes = useMemo(() => new Set(cart.map((it) => it.code)), [cart]);

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
          className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 pr-12 text-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
        />
        {query && (
          <button
            type="button"
            aria-label="ล้างคำค้นหา"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* แถบหมวดหมู่ — ปัดดูได้บนมือถือ */}
      {dataReady && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {sortedCategories.map((c) => (
            <button
              key={c.key}
              onClick={() =>
                setCategory((prev) => (prev === c.key ? null : c.key))
              }
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${
                category === c.key
                  ? "border-brand-600 bg-brand-600 font-medium text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-brand-300"
              }`}
            >
              {c.icon} {c.label}
              <span
                className={`ml-1 text-xs ${
                  category === c.key ? "text-brand-100" : "text-gray-400"
                }`}
              >
                {catCounts[c.key]}
              </span>
            </button>
          ))}
        </div>
      )}

      <ExecUnlock unlocked={unlocked} onUnlock={unlock} onLogout={logout} />

      {dataReady && (
        <p className="text-sm text-gray-500">
          {category
            ? `หมวด ${CATEGORIES.find((c) => c.key === category)?.label} ${pool.length.toLocaleString("th-TH")} รายการ`
            : `ฐานข้อมูล ${allProducts.length.toLocaleString("th-TH")} รายการ`}
          {searched &&
            (results.length >= 50
              ? ` • พบมากกว่า 50 รายการ — แสดง 50 แรก (พิมพ์ให้เจาะจงขึ้น)`
              : ` • พบ ${results.length.toLocaleString("th-TH")} รายการ`)}
          {!searched && category && pool.length > 50 && ` • แสดง 50 แรก`}
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
            currentPrice={
              product.code ? currentPrices[product.code] : undefined
            }
            inCart={product.code ? cartCodes.has(product.code) : false}
            onAddToCart={() => addToCart(product)}
          />
        ))}
      </div>

      {searched && results.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
          ไม่พบสินค้าที่ตรงกับ &ldquo;{debounced}&rdquo;
          {category && (
            <p className="mt-2 text-sm">
              (กำลังค้นเฉพาะหมวดที่เลือก —{" "}
              <button
                onClick={() => setCategory(null)}
                className="text-brand-600 underline"
              >
                ค้นทุกหมวด
              </button>
              )
            </p>
          )}
        </div>
      )}

      <QuoteCart
        items={cart}
        onChangeQty={(code, qty) =>
          setCart((prev) =>
            qty <= 0
              ? prev.filter((it) => it.code !== code)
              : prev.map((it) => (it.code === code ? { ...it, qty } : it))
          )
        }
        onChangePrice={(code, price) =>
          setCart((prev) =>
            prev.map((it) => (it.code === code ? { ...it, price } : it))
          )
        }
        onRemove={(code) =>
          setCart((prev) => prev.filter((it) => it.code !== code))
        }
        onClear={() => setCart([])}
      />
    </div>
  );
}
