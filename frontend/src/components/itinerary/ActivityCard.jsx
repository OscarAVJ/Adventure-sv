import { BadgeList } from "./BadgeList";
import { formatCurrency } from "../../utils/formatCurrency";

export function ActivityCard({ activity }) {
  const displayCost = activity.estimatedTotalCostUsd ?? activity.costUsd;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-700">{activity.time}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">
            {activity.name}
          </h3>
          <p className="text-sm capitalize text-slate-500">{activity.type}</p>
        </div>

        <p className="shrink-0 text-sm font-semibold text-slate-950">
          {formatCurrency(displayCost)}
        </p>
      </div>

      <div className="mt-3">
        <BadgeList badges={activity.badges} />
      </div>

      {activity.matchReasons?.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {activity.matchReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {activity.notes && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
          {activity.notes}
        </p>
      )}

      {activity.spendingBreakdown?.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Desglose estimado
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {activity.spendingBreakdown.map((item) => (
              <li
                key={`${activity.name}-${item.category}`}
                className="flex items-start justify-between gap-3"
              >
                <span>{item.category}</span>
                <span className="font-medium text-slate-950">
                  {formatCurrency(item.costUsd)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

