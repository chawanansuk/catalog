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
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold text-brand-600">
              🔧 WYNNS
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-brand-600">
                ค้นหาราคา
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Catalog. สร้างด้วย Next.js
        </footer>
      </body>
    </html>
  );
}
