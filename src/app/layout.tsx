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
        <header className="sticky top-0 z-10 border-b-4 border-brand-600 bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-12 items-center justify-center rounded-full bg-lion-500 text-lg shadow-sm">
                🦁
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-2xl font-extrabold italic tracking-tight text-brand-600">
                  WYNN&apos;S
                </span>
                <span className="mt-0.5 text-[9px] font-semibold tracking-[0.25em] text-gray-400">
                  WYNNS TOOLS · 威力狮
                </span>
              </span>
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-brand-700">
              <Link href="/" className="transition hover:text-brand-600">
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
