import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "WYNN'S — ค้นหาราคาสินค้า",
  description: "ค้นหาราคาสินค้า WYNNS ด้วยรหัสสินค้า ดูราคาขายส่ง และขายปลีก",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WYNN'S",
  },
  icons: {
    icon: `${basePath}/icons/icon-192.png`,
    apple: `${basePath}/icons/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  themeColor: "#1d6b41",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="min-h-screen">
        <ServiceWorkerRegister />
        <header className="sticky top-0 z-10 bg-brand-600 shadow-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center">
              {/* โลโก้ WYNN'S จริง (ดึงจากแคตตาล็อก) วางในกล่องขาวบนแถบเขียว */}
              <span className="rounded-md bg-white px-3 py-1.5 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${basePath}/wynns-logo.png`}
                  alt="WYNN'S — 威力狮"
                  className="h-7 w-auto"
                />
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
