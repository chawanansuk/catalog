import Link from "next/link";
import type { Product } from "@/data/products";
import { formatBaht } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-gray-50 text-6xl">
        {product.image}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium text-brand-600">
          {product.category}
        </span>
        <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-brand-600">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-gray-900">
            {formatBaht(product.price)}
          </span>
          {product.inStock ? (
            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
              มีสินค้า
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
              สินค้าหมด
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
