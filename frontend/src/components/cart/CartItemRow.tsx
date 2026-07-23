"use client";

import { CartItem } from "@/lib/cart.types";

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  const unitPrice = parseFloat(item.product.price);
  const subtotal = unitPrice * item.quantity;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-2xl">
        🥗
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {item.product.name}
        </p>
        <p className="mt-0.5 text-sm text-brand-700">${unitPrice.toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="Reducir cantidad"
        >
          −
        </button>
        <span className="flex h-8 w-10 items-center justify-center text-sm font-medium text-slate-900">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          disabled={item.quantity >= item.product.stock}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      <p className="w-20 text-right text-sm font-semibold text-slate-900">
        ${subtotal.toFixed(2)}
      </p>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        aria-label="Eliminar"
      >
        ✕
      </button>
    </div>
  );
}
