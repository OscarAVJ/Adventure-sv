import { ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { BadgeList } from "./BadgeList";
import { formatCurrency } from "../../utils/formatCurrency";

export function ActivityCard({ activity, isRerolling = false, rerollError = null, onReroll }) {
  const displayCost = activity.estimatedTotalCostUsd ?? activity.costUsd;
  const openStatus = getOpenStatus(activity.openNow);
  const todayHours = getTodayHours(activity.openingHours);

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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReroll}
          disabled={isRerolling || !activity.id}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRerolling ? "animate-spin" : ""}`} />
          {isRerolling ? "Buscando opcion..." : "Cambiar actividad"}
        </button>
        {rerollError && <p className="text-sm font-medium text-red-600">{rerollError}</p>}
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

      <div className="mt-3 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
        {activity.googleMapsUrl && (
          <a
            href={activity.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-medium text-brand-700 hover:text-brand-800"
          >
            <MapPin className="h-4 w-4" />
            Abrir ubicacion en Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {activity.address && <p>{activity.address}</p>}
        <p>
          <span className="font-medium text-slate-950">Estado:</span>{" "}
          {openStatus}
        </p>
        {todayHours && (
          <p>
            <span className="font-medium text-slate-950">Horario:</span>{" "}
            {todayHours}
          </p>
        )}
      </div>

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

function getOpenStatus(openNow) {
  if (openNow === true) return "Abierto ahora";
  if (openNow === false) return "Cerrado ahora";
  return "Horario no disponible";
}

function getTodayHours(openingHours) {
  if (!Array.isArray(openingHours) || openingHours.length === 0) return "";
  return openingHours[0];
}

