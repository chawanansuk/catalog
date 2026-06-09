import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "WYNNS — ค้นหาราคาสินค้า",
  description: "ค้นหาราคาสินค้า WYNNS ด้วยรหัสสินค้า ดูราคาทุน ขายส่ง และขายพิเศษ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="min-h-screen">
        <header className="sticky top-0 z-10 bg-brand-600 shadow-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex flex-col leading-none">
                <span className="flex items-center text-3xl font-black italic tracking-tighter text-white">
                  WY
                  <span className="mx-[1px] inline-block h-0 w-0 -skew-x-12 border-y-[11px] border-l-[14px] border-y-transparent border-l-accent-500 align-middle" />
                  NN&apos;S
                </span>
                <span className="mt-1 text-[9px] font-semibold tracking-[0.3em] text-brand-100">
                  WYNNS TOOLS · 威力狮
                </span>
              </span>
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-brand-100">
              <Link href="/" className="transition hover:text-white">
                ค้นหาราคา
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} WYNNS (威力狮) · ระบบค้นหาราคาสินค้า
        </footer>
      </body>
    </html>
  );
}
