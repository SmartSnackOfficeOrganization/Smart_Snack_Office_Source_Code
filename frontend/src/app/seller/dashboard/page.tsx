import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

function DashboardCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-2xl transition group-hover:bg-brand-200">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-brand-700">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Link>
  );
}

export default function SellerDashboardPage() {
  return (
    <DashboardShell
      role="seller"
      title="Panel de vendedor"
      description="Administra tu catálogo de snacks y optimiza tu presencia en Smart Snack."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          href="/seller/products"
          icon="📦"
          title="Gestionar catálogo"
          description="Crea, edita y elimina productos con fichas nutricionales."
        />
        <DashboardCard
          href="/seller/orders"
          icon="📋"
          title="Gestionar pedidos"
          description="Revisa órdenes confirmadas y genera etiquetas de envío."
        />
        <DashboardCard
          href="#"
          icon="👤"
          title="Mi perfil"
          description="Edita tu información de vendedor."
        />
      </div>
    </DashboardShell>
  );
}
