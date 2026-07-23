"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSellerOrders, downloadShippingLabels, OrderData } from "@/lib/seller/orders";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "paid", label: "Confirmados" },
  { value: "shipped", label: "Enviados" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSellerOrders(statusFilter || undefined);
      setOrders(data);
    } catch {
      setError("Error al cargar pedidos.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  }

  async function handleGenerateLabels() {
    if (selected.size === 0) return;
    setGenerating(true);
    setError(null);
    try {
      await downloadShippingLabels(Array.from(selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar etiquetas.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <DashboardShell
      role="seller"
      title="Gestionar pedidos"
      description="Revisa las órdenes confirmadas y genera etiquetas de envío."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSelected(new Set());
            }}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">
            {selected.size} de {orders.length} seleccionados
          </p>
          <Button
            disabled={selected.size === 0 || generating}
            onClick={handleGenerateLabels}
          >
            {generating ? "Generando…" : "Generar etiquetas de envío"}
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Cargando pedidos…</p>
      ) : orders.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No hay pedidos{statusFilter ? ` con estado "${statusFilter}"` : ""}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selected.size === orders.length}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => toggle(order.id)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {order.buyer_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.buyer_company || "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">
                    {order.delivery_address}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    ${order.total}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : order.status === "shipped"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "delivered"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status === "paid"
                        ? "Confirmado"
                        : order.status === "shipped"
                          ? "Enviado"
                          : order.status === "delivered"
                            ? "Entregado"
                            : order.status === "cancelled"
                              ? "Cancelado"
                              : order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
