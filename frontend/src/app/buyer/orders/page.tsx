"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getMyOrders, downloadReceipt, BuyerOrder } from "@/lib/buyer-orders";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pending_payment", label: "Pendiente de pago" },  
  { value: "paid", label: "Confirmado" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "payment_failed", label: "Pago fallido" },        
];

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders(statusFilter || undefined);
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

  async function handleDownload(orderId: string) {
    setDownloadingId(orderId);
    setError(null);
    try {
      await downloadReceipt(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar.");
    } finally {
      setDownloadingId(null);
    }
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      pending_payment: "bg-amber-100 text-amber-700",
      paid: "bg-green-100 text-green-700",
      shipped: "bg-blue-100 text-blue-700",
      delivered: "bg-slate-100 text-slate-600",
      cancelled: "bg-red-100 text-red-700",
      payment_failed: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      pending_payment: "Pendiente de pago",
      paid: "Confirmado",
      shipped: "Enviado",
      delivered: "Entregado",
      cancelled: "Cancelado",
      payment_failed: "Pago fallido",
    };
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}
      >
        {labels[status] || status}
      </span>
    );
  }

  return (
    <DashboardShell
      role="buyer"
      title="Mis pedidos"
      description="Historial de tus compras y descarga de comprobantes."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500">{orders.length} pedido{orders.length !== 1 ? "s" : ""}</p>
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
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Productos</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex flex-col gap-0.5">
                      {order.items.map((item) => (
                        <span key={item.id} className="text-xs">
                          {item.quantity}x {item.product_name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    ${order.total}
                  </td>
                  <td className="px-4 py-3">{statusBadge(order.status)}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      onClick={() => handleDownload(order.id)}
                      disabled={downloadingId === order.id}
                      className="text-xs"
                    >
                      {downloadingId === order.id ? "Descargando…" : "Descargar PDF"}
                    </Button>
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