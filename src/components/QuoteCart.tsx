"use client";

import { useState } from "react";
import { formatBaht } from "@/lib/format";

export type CartItem = {
  code: string;
  name: string;
  unit?: string;
  price: number;
  qty: number;
};

function buildQuoteText(items: CartItem[]): string {
  const lines: string[] = ["ใบเสนอราคา", ""];
  items.forEach((it, i) => {
    lines.push(
      `${i + 1}. ${it.code} ${it.name}`,
      `   ${it.qty} ${it.unit ?? "ชิ้น"} × ${formatBaht(it.price)} = ${formatBaht(it.price * it.qty)}`
    );
  });
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  lines.push("", `รวม ${items.length} รายการ = ${formatBaht(total)}`);
  return lines.join("\n");
}

export function QuoteCart({
  items,
  onChangeQty,
  onChangePrice,
  onRemove,
  onClear,
}: {
  items: CartItem[];
  onChangeQty: (code: string, qty: number) => void;
  onChangePrice: (code: string, price: number) => void;
  onRemove: (code: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);

  if (items.length === 0) return null;

  return (
    <>
      {/* ปุ่มลอยมุมขวาล่าง */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 font-medium text-white shadow-lg hover:bg-brand-700"
      >
        🧾 ใบเสนอราคา
        <span className="rounded-full bg-white px-2 py-0.5 text-sm font-bold text-brand-700">
          {items.length}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                🧾 ใบเสนอราคา ({items.length} รายการ)
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.code}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-brand-700">
                        {it.code}
                      </span>
                      <p className="truncate text-sm text-gray-800">
                        {it.name}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemove(it.code)}
                      className="shrink-0 text-xs text-gray-400 hover:text-red-500"
                    >
                      ลบ
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onChangeQty(it.code, it.qty - 1)}
                        className="h-8 w-8 rounded-md border border-gray-300 font-bold text-gray-600 hover:bg-gray-50"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-medium">
                        {it.qty}
                      </span>
                      <button
                        onClick={() => onChangeQty(it.code, it.qty + 1)}
                        className="h-8 w-8 rounded-md border border-gray-300 font-bold text-gray-600 hover:bg-gray-50"
                      >
                        +
                      </button>
                      <span className="ml-1 text-xs text-gray-400">
                        {it.unit ?? "ชิ้น"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">ราคา/หน่วย</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={it.price}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v >= 0)
                            onChangePrice(it.code, v);
                        }}
                        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-right text-sm font-semibold text-gray-800">
                    = {formatBaht(it.price * it.qty)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
              <span className="font-medium text-gray-700">รวมทั้งหมด</span>
              <span className="text-xl font-bold text-brand-700">
                {formatBaht(total)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(buildQuoteText(items));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    /* เบราว์เซอร์เก่าอาจไม่รองรับ */
                  }
                }}
                className="rounded-lg border border-brand-600 py-2.5 font-medium text-brand-700 hover:bg-brand-50"
              >
                {copied ? "คัดลอกแล้ว ✓" : "📋 คัดลอก"}
              </button>
              <a
                href={`https://line.me/R/share?text=${encodeURIComponent(buildQuoteText(items))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[#06C755] py-2.5 text-center font-medium text-white hover:opacity-90"
              >
                💬 ส่งทาง LINE
              </a>
            </div>
            <button
              onClick={() => {
                if (confirm("ล้างใบเสนอราคาทั้งหมด?")) {
                  onClear();
                  setOpen(false);
                }
              }}
              className="mt-2 w-full py-2 text-sm text-gray-400 hover:text-red-500"
            >
              ล้างทั้งหมด
            </button>
          </div>
        </div>
      )}
    </>
  );
}
