import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReviewPrompt } from "@/components/buyer/ReviewPrompt";
import { RecommendedSection } from "@/components/catalog/RecommendedSection";

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

export default function BuyerDashboardPage() {
  return (
    <DashboardShell
      role="buyer"
      title="Bienvenido a tu panel de comprador"
      description="Aquí podrás explorar el catálogo, gestionar pedidos corporativos y configurar entregas a tu oficina."
    >
      <ReviewPrompt />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          href="/buyer/catalog"
          icon="🔍"
          title="Explorar catálogo"
          description="Navega por categorías, filtra y ordena productos."
        />
        <DashboardCard
          href="/buyer/orders"
          icon="📋"
          title="Mis pedidos"
          description="Historial de compras y descarga de comprobantes."
        />
        <DashboardCard
          href="/buyer/profile"
          icon="⚙️"
          title="Mi Perfil"
          description="Configura tus alergias y restricciones dietéticas."
        />
      </div>
      <RecommendedSection className="mt-8" limit={5} />
    </DashboardShell>
  );
}
