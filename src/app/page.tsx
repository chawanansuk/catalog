import { CatalogBrowser } from "@/components/CatalogBrowser";
import { categories, products } from "@/data/products";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-10 text-white">
        <h1 className="text-3xl font-bold">แคตตาล็อกสินค้า</h1>
        <p className="mt-2 max-w-xl text-brand-50">
          ค้นหาและเลือกชมสินค้าคุณภาพหลากหลายหมวดหมู่ ในที่เดียว
        </p>
      </section>

      <CatalogBrowser products={products} categories={categories} />
    </div>
  );
}
