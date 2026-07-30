"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/buyer-orders";

interface PendingItem {
  productId: string;
  productName: string;
}

export function ReviewPrompt() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const orders = await getMyOrders("delivered");
        if (cancelled) return;
        const list: PendingItem[] = [];
        const seen = new Set<string>();
        for (const order of orders) {
          const reviewed = new Set(order.reviewed_product_ids ?? []);
          for (const item of order.items) {
            if (!reviewed.has(item.product) && !seen.has(item.product)) {
              seen.add(item.product);
              list.push({
                productId: item.product,
                productName: item.product_name,
              });
            }
          }
        }
        setPending(list);
      } catch {
        // silence error – banner is optional
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-800">
        Tienes {pending.length} producto{pending.length !== 1 ? "s" : ""} pendiente
        {pending.length !== 1 ? "s" : ""} de calificar
      </p>
      <p className="mt-1 text-xs text-amber-600">
        Cuéntale a otros compradores tu experiencia con estos productos:
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {pending.map((p) => (
          <Link
            key={p.productId}
            href={`/buyer/products/${p.productId}`}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm transition hover:bg-amber-100"
          >
            {p.productName}
          </Link>
        ))}
      </div>
    </div>
  );
}
