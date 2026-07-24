import Link from "next/link";

interface SmartSnackLogoProps {
  href?: string;
}

export function SmartSnackLogo({ href = "/" }: SmartSnackLogoProps) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg shadow-md shadow-brand-600/25 transition group-hover:scale-105">
        🥗
      </span>
      <div className="text-left leading-tight">
        <span className="block text-base font-bold text-slate-900">Smart Snack</span>
        <span className="block text-xs text-slate-500">Bienestar corporativo</span>
      </div>
    </Link>
  );
}
