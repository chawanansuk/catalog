import { PriceLookup } from "@/components/PriceLookup";
import { products } from "@/lib/products";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">ค้นหาราคาสินค้า WYNNS</h1>
        <p className="mt-2 text-brand-50">
          พิมพ์รหัสสินค้าเพื่อดูราคาทุน ราคาขายส่ง และราคาขายพิเศษ ทันที
        </p>
        <p className="mt-1 text-sm text-brand-100">
          ฐานข้อมูล {products.length.toLocaleString("th-TH")} รายการ
        </p>
      </section>

      <PriceLookup />
    </div>
  );
}
