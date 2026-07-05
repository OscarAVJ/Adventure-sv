import { SlidersHorizontal } from "lucide-react";
import { useI18n } from "../../i18n/useI18n";

export function AdjustmentsPanel({ adjustments = [] }) {
  const { t } = useI18n();
  if (!adjustments.length) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold text-slate-950">{t.itinerary.appliedAdjustments}</h2>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {adjustments.map((adjustment) => (
          <li key={adjustment} className="rounded-lg bg-slate-50 px-3 py-2">
            {adjustment}
          </li>
        ))}
      </ul>
    </section>
  );
}

