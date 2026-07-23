"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { AllergySelector } from "@/components/profile/AllergySelector";
import { getBuyerProfile, updateBuyerProfile, BuyerProfileData } from "@/lib/buyer-profile";
import { getTags } from "@/lib/catalog-browse";

export default function BuyerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<BuyerProfileData | null>(null);
  const [aviallTags, setAviallTags] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [profileData, tags] = await Promise.all([
          getBuyerProfile(),
          getTags().catch(() => [] as { id: string; name: string }[]),
        ]);
        setProfile(profileData);
        setAllergies(profileData.allergies ?? []);
        setDeliveryAddress(profileData.delivery_address ?? "");
        setCompanyName(profileData.company_name ?? "");
        setAviallTags(tags.map((t: { id: string; name: string }) => t.name));
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateBuyerProfile({
        delivery_address: deliveryAddress || null,
        company_name: companyName || null,
        allergies,
      });
      setProfile(updated);
      setSuccess("Perfil actualizado correctamente.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <p className="text-sm text-slate-500">Cargando perfil…</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <p className="text-sm text-slate-500">Redirigiendo…</p>
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
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>

        {error && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="alert"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Correo electrónico</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre completo</label>
            <input
              type="text"
              value={profile.full_name}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Dirección de entrega
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Oficina, piso, edificio…"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Nombre de empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Nombre de tu empresa (opcional)"
            />
          </div>

          <AllergySelector allTags={aviallTags} selected={allergies} onChange={setAllergies} />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/buyer/dashboard")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
