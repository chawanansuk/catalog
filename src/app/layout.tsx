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
        <header className="sticky top-0 z-10 border-b border-brand-700 bg-brand-600 text-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xl shadow">
                🦁
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-xl font-extrabold tracking-tight">
                  WYNNS
                </span>
                <span className="mt-1 text-[10px] font-medium tracking-[0.2em] text-brand-100">
                  威力狮 · เครื่องมือช่าง
                </span>
              </span>
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-brand-50">
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
