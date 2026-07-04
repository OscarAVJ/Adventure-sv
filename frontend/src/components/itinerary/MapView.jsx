import { MapPinned } from "lucide-react";

export function MapView({ days = [] }) {
  const activities = days.flatMap((day) =>
    day.activities
      .filter((activity) => activity.coordinates)
      .map((activity) => ({ ...activity, day: day.day }))
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <MapPinned className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold text-slate-950">Mapa del recorrido</h2>
      </div>

      <div className="relative mt-4 h-72 overflow-hidden rounded-lg border border-brand-100 bg-brand-50">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,99,235,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(37,99,235,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
        {activities.map((activity, index) => {
          const left = 15 + ((index * 23) % 70);
          const top = 18 + ((index * 17) % 58);

          return (
            <div
              key={`${activity.day}-${activity.time}-${activity.name}`}
              className="absolute"
              style={{ left: `${left}%`, top: `${top}%` }}
              title={activity.name}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-lg ring-4 ring-white">
                {activity.day}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        {activities.map((activity) => (
          <div
            key={`legend-${activity.day}-${activity.time}-${activity.name}`}
            className="flex items-center gap-2"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {activity.day}
            </span>
            <span className="truncate">{activity.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

