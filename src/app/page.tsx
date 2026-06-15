import { PriceLookup } from "@/components/PriceLookup";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-8 text-white">
        <span className="pointer-events-none absolute -right-4 -top-6 select-none text-[9rem] leading-none opacity-10">
          🔧
        </span>
        <div className="relative">
          <h1 className="text-2xl font-bold sm:text-3xl">
            ค้นหาราคาสินค้า WYNNS
          </h1>
          <p className="mt-2 max-w-xl text-brand-50">
            พิมพ์รหัสสินค้าเพื่อดูราคาขายส่ง และราคาปลีก ทันที
          </p>
        </div>
      </section>

      <PriceLookup />
    </div>
  );
}
