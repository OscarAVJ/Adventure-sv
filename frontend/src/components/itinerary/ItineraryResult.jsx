import { CalendarCheck2 } from "lucide-react";
import { AdjustmentsPanel } from "./AdjustmentsPanel";
import { BudgetSummary } from "./BudgetSummary";
import { DayTimeline } from "./DayTimeline";
import { MapView } from "./MapView";

export function ItineraryResult({ itinerary }) {
  if (!itinerary) return null;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-brand-100 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <CalendarCheck2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-700">Itinerario generado</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {itinerary.summary}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {itinerary.context?.season?.label && (
                <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                  {itinerary.context.season.label}
                </span>
              )}
              {itinerary.context?.occasion?.label && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  {itinerary.context.occasion.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <BudgetSummary
        budgetUsd={itinerary.budgetUsd}
        estimatedCostUsd={itinerary.estimatedCostUsd}
      />
      <AdjustmentsPanel adjustments={itinerary.adjustments} />
      <MapView days={itinerary.days} />

      <div className="space-y-4">
        {itinerary.days.map((day) => (
          <DayTimeline key={`${day.day}-${day.date}`} day={day} />
        ))}
      </div>
    </div>
  );
}

