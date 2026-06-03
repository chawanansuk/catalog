import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, products } from "@/data/products";
import { formatBaht } from "@/lib/format";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        ← กลับไปหน้าสินค้าทั้งหมด
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-2xl border border-gray-200 bg-white text-[10rem]">
          {product.image}
        </div>

        <div className="space-y-4">
          <span className="text-sm font-medium text-brand-600">
            {product.category}
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-3xl font-bold text-gray-900">
            {formatBaht(product.price)}
          </p>

          {product.inStock ? (
            <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              ✓ มีสินค้าพร้อมจัดส่ง
            </span>
          ) : (
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500">
              สินค้าหมดชั่วคราว
            </span>
          )}

          <p className="leading-relaxed text-gray-600">{product.description}</p>

          <div className="flex flex-wrap gap-2 pt-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500"
              >
                #{tag}
              </span>
            ))}
          </div>

          <button
            disabled={!product.inStock}
            className="mt-4 w-full rounded-lg bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {product.inStock ? "เพิ่มลงตะกร้า" : "สินค้าหมด"}
          </button>
        </div>
      </div>
    </div>
  );
}
