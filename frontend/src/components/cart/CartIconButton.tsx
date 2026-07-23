"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/cart";

export function CartIconButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getCartCount().then(setCount);
  }, []);

  return (
    <Link
      href="/buyer/cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:bg-slate-100"
      aria-label="Carrito de compras"
    >
      🛒
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
