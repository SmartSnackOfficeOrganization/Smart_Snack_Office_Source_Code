"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { CartItemRow } from "@/components/cart/CartItemRow";
import {
  getCartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  checkout,
  CartError,
} from "@/lib/cart";
import { CartItem } from "@/lib/cart.types";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCartItems();
      setItems(data.items);
      setTotalItems(data.total_items);
    } catch (err) {
      if (err instanceof CartError && err.code === "AUTH") {
        router.replace("/login");
        return;
      }
      setError(
        err instanceof CartError ? err.message : "Error al cargar el carrito.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  async function handleQuantityChange(id: string, quantity: number) {
    if (quantity < 1) return;
    const prev = items.find((i) => i.id === id);
    const delta = prev ? quantity - prev.quantity : 0;
    try {
      setItems((prevItems) =>
        prevItems.map((i) => (i.id === id ? { ...i, quantity } : i)),
      );
      setTotalItems((prev) => Math.max(0, prev + delta));
      await updateCartItemQuantity(id, quantity);
    } catch {
      fetchCart();
    }
  }

  async function handleRemove(id: string) {
    const removed = items.find((i) => i.id === id);
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotalItems((prev) => Math.max(0, prev - (removed?.quantity ?? 0)));
      await removeCartItem(id);
    } catch {
      fetchCart();
    }
  }

  async function handleClear() {
    try {
      setItems([]);
      setTotalItems(0);
      await clearCart();
    } catch {
      fetchCart();
    }
  }

  async function handleCheckout() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      await checkout();
      router.push("/buyer/dashboard");
    } catch (err) {
      const msg =
        err instanceof CartError
          ? err.message
          : "Error al procesar el pago. Intenta de nuevo.";
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0,
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <p className="text-sm text-slate-500">Cargando carrito…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <SmartSnackLogo />
          <Button
            variant="secondary"
            onClick={() => router.push("/buyer/dashboard")}
          >
            Volver al panel
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Carrito de compras
        </h1>

        {error && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!error && items.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-5xl">🛒</p>
            <p className="mt-6 text-sm text-slate-500">
              Tu carrito está vacío.
            </p>
            <Link href="/buyer/catalog">
              <Button className="mt-6">Explorar catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
              />
            ))}

            {items.length > 0 && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm text-slate-500 underline transition hover:text-red-600"
                >
                  Vaciar carrito
                </button>
              </div>
            )}

            <hr className="my-5 border-slate-100" />

            <div className="flex flex-col items-end gap-4">
              <p className="text-lg font-bold text-slate-900">
                Total: ${subtotal.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500">
                {totalItems} artículo{totalItems !== 1 ? "s" : ""}
              </p>
              {checkoutError && (
                <div
                  className="w-full max-w-xs rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {checkoutError}
                </div>
              )}
              <Button
                fullWidth
                className="max-w-xs"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Confirmando pedido…" : "Proceder al pago"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
