import { CloudSun } from "lucide-react";
import { ActivityCard } from "./ActivityCard";
import { formatCurrency } from "../../utils/formatCurrency";

export function DayTimeline({ day }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-700">Dia {day.day}</p>
          <h2 className="text-xl font-semibold text-slate-950">{day.zone}</h2>
          <p className="text-sm text-slate-500">{day.date}</p>
        </div>
        <p className="text-sm font-semibold text-slate-900">
          {formatCurrency(day.costUsd)}
        </p>
      </div>

      {day.weatherSummary && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <CloudSun className="h-4 w-4 text-brand-600" />
          {day.weatherSummary}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {day.activities.map((activity) => (
          <ActivityCard
            key={`${day.day}-${activity.time}-${activity.name}`}
            activity={activity}
          />
        ))}
      </div>
    </section>
  );
}

