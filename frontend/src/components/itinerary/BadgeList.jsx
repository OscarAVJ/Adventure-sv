import { cn } from "../../utils/cn";

const badgeStyles = {
  Recomendado: "bg-brand-600 text-white",
  Recommended: "bg-brand-600 text-white",
  "Sugerido por temporada": "bg-brand-100 text-brand-800",
  "Ideal para aniversario": "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
  "Ideal para cumpleanos": "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
  "Abierto ahora": "bg-slate-100 text-slate-700",
  "Open now": "bg-slate-100 text-slate-700",
  "Dentro del presupuesto": "bg-slate-100 text-slate-700",
  "Within budget": "bg-slate-100 text-slate-700",
  "Ahorro aplicado": "bg-slate-100 text-slate-700",
  "Adjusted to budget": "bg-slate-100 text-slate-700",
};

export function BadgeList({ badges = [] }) {
  if (!badges.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            badgeStyles[badge] || "bg-brand-50 text-brand-700"
          )}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

