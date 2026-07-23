interface PaymentStatusIconProps {
  tone: "pending" | "success" | "error";
}

const toneStyles: Record<PaymentStatusIconProps["tone"], string> = {
  pending: "bg-slate-100 text-slate-500 animate-pulse",
  success: "bg-brand-100",
  error: "bg-red-100",
};

const toneIcon: Record<PaymentStatusIconProps["tone"], string> = {
  pending: "⏳",
  success: "✅",
  error: "❌",
};

export function PaymentStatusIcon({ tone }: PaymentStatusIconProps) {
  return (
    <div
      className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-inner ${toneStyles[tone]}`}
      aria-hidden
    >
      {toneIcon[tone]}
    </div>
  );
}