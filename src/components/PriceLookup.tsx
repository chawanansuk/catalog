"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchProducts, type WynnsProduct } from "@/lib/products";
import { formatBaht } from "@/lib/format";

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

function ProductResult({ product }: { product: WynnsProduct }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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

      <h3 className="mt-2 font-medium text-gray-900">{product.name}</h3>
      {product.nameZh && (
        <p className="mt-0.5 text-xs text-gray-400">{product.nameZh}</p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <PriceRow label="ราคาทุน" value={product.cost} highlight />
        <PriceRow label="ขายส่งพิเศษ" value={product.wholesaleSpecial} />
        <PriceRow label="ขายส่ง" value={product.wholesale} />
        <PriceRow label="ราคาขายปลีก" value={product.retail} />
        <PriceRow label="ราคารวมภาษี" value={product.priceIncVat} />
        <PriceRow label="ราคาส่งออก" value={product.priceExport} />
      </div>
    </div>
  );
}

export function PriceLookup() {
  const [allProducts, setAllProducts] = useState<WynnsProduct[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // โหลดข้อมูลครั้งเดียวตอนเปิดหน้า แล้วค้นหาในเบราว์เซอร์ทั้งหมด (ไม่ต้องมีเซิร์ฟเวอร์)
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    fetch(`${base}/wynns.json`)
      .then((res) => res.json())
      .then((data: WynnsProduct[]) => {
        setAllProducts(data);
        setDataReady(true);
      })
      .catch(() => setDataReady(true));
  }, []);

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

  const searched = debounced.trim().length > 0;

  return (
    <div className="space-y-6">
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

      {dataReady && (
        <p className="text-sm text-gray-500">
          ฐานข้อมูล {allProducts.length.toLocaleString("th-TH")} รายการ
          {searched &&
            ` • พบ ${results.length.toLocaleString("th-TH")} รายการ${
              results.length >= 50 ? " (แสดง 50 แรก)" : ""
            }`}
        </p>
      )}

      <div className="space-y-3">
        {results.map((product, i) => (
          <ProductResult key={`${product.code}-${i}`} product={product} />
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
